<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, string $invoiceId)
    {
        $request->validate([
            'tgl_bayar' => ['required', 'date'],
            'jumlah_bayar' => ['required', 'numeric', 'min:1'],
            'metode_pembayaran' => ['required', 'string'],
            'bukti_transfer' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
            'catatan_finance' => ['nullable', 'string'],
        ]);

        $invoice = Invoice::findOrFail($invoiceId);

        if (in_array($invoice->status_tagihan, ['paid', 'Paid'])) {
            abort(422, 'Invoice sudah lunas.');
        }

        if (in_array($invoice->status_tagihan, ['cancelled', 'Cancelled'])) {
            abort(422, 'Invoice sudah dibatalkan.');
        }

        $path = null;

        if ($request->hasFile('bukti_transfer')) {
            $path = $request->file('bukti_transfer')->store('payments', 'public');
        }

        $invoice->payments()->create([
            'tgl_bayar' => $request->tgl_bayar,
            'jumlah_bayar' => $request->jumlah_bayar,
            'metode_pembayaran' => $request->metode_pembayaran,
            'bukti_transfer_path' => $path,
            'catatan_finance' => $request->catatan_finance,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Pembayaran berhasil dikirim dan menunggu verifikasi finance.');
    }

    private function getVerifiedTotal(Invoice $invoice): float
    {
        return (float) $invoice->payments()
            ->where('status', 'verified')
            ->sum('jumlah_bayar');
    }

    private function isInvoicePaid(Invoice $invoice): bool
    {
        return in_array($invoice->status_tagihan, ['paid', 'Paid']);
    }

    private function getInvoiceCategory(Invoice $invoice): string
    {
        if ($invoice->kategori_invoice) {
            return $invoice->kategori_invoice;
        }

        $text = strtolower(($invoice->title ?? '') . ' ' . ($invoice->no_invoice ?? ''));

        if (str_contains($text, 'sample')) {
            return 'sample';
        }

        if (str_contains($text, 'production')) {
            return 'production';
        }

        // if (str_contains($text, 'final')) {
        //     return 'final';
        // }

        return 'other';
    }

    private function handleSamplePaymentVerified(Invoice $invoice, bool $invoicePaid): void
    {
        $pesanan = $invoice->pesanan;

        if (!$pesanan) {
            return;
        }

        DB::transaction(function () use ($pesanan, $invoice, $invoicePaid) {
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'sample_invoice_created' => true,
                    'sample_paid' => $invoicePaid,
                ]
            );

            $pesanan->invoices()->where('id', $invoice->id)->update([
                'status_tagihan' => $invoicePaid ? 'paid' : 'partially_paid',
            ]);

            $pesanan->workflowHistory()->create([
                'step' => 'sample_payment',
                'action' => $invoicePaid ? 'sample_payment_paid' : 'sample_payment_verified',
                'user_id' => Auth::user()->id,
                'notes' => $invoicePaid
                    ? 'Invoice sample sudah lunas.'
                    : 'Pembayaran invoice sample telah diverifikasi.',
            ]);

            // $invoice->update([
            //     'status_tagihan' => 'paid',
            // ]);

            // $pesanan->workflowStatus()->update([
            //     'sample_paid' => true,
            //     'purchasing' => false,
            //     'materials_received' => false,
            // ]);

            // $pesanan->workflowHistory()->create([
            //     'step' => 'sample',
            //     'action' => 'payment_verified',
            //     'user_id' => Auth::user()->id,
            //     'notes' => 'Invoice sample lunas. Purchasing untuk sample dan production sudah dapat dimulai.',
            // ]);
        });
    }

    private function handleProductionPaymentVerified(invoice $invoice, float $verifiedTotal, bool $invoicePaid): void
    {
        $pesanan = $invoice->pesanan;

        if (!$pesanan) {
            return;
        }

        $productionDpPaid = $verifiedTotal > 0;

        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            [
                'production_invoice_created' => true,
                'production_dp_paid' => $productionDpPaid,
                'final_payment_paid' => $invoicePaid,
            ]
        );

        $pesanan->invoices()->where('id', $invoice->id)->update([
            'status_tagihan' => $invoicePaid ? 'paid' : 'partially_paid',
        ]);

        $pesanan->workflowHistory()->create([
            'step' => 'production_payment',
            'action' => $invoicePaid ? 'production_payment_paid' : 'production_dp_paid',
            'user_id' => Auth::user()->id,
            'notes' => $invoicePaid
                ? 'Invoice produksi sudah lunas.'
                : 'DP Produksi telah diverifikasi.',
        ]);
    }

    public function verifyPayment(string $paymentId, InvoiceService $invoiceService)
    {
        $payment = Payment::with ([
            'invoice.payments',
            'invoice.sample.pesanan.workflowStatus',
            'invoice.pesanan.workflowStatus'
        ])->findOrFail($paymentId);

        DB::transaction(function () use ($payment, $invoiceService) {
            $payment->update([
                'status' => 'verified',
                'verified_by' => Auth::user()->id,
                'verified_at' => now(),
                'rejection_note' => null,
            ]);

            $invoice = $invoiceService->recalculateStatus($payment->invoice);
            $invoice->load([
                'payments',
                'sample.pesanan.workflowStatus',
                'pesanan.workflowStatus',
            ]);

            $category = $this->getInvoiceCategory($invoice);
            $verifiedTotal = $this->getVerifiedTotal($invoice);
            $invoicePaid = $this->isInvoicePaid($invoice);


            if ($category === 'sample') {
                $this->handleSamplePaymentVerified($invoice, $invoicePaid);
                return;
            }

            if ($category === 'production') {
                $this->handleProductionPaymentVerified(
                    invoice: $invoice,
                    verifiedTotal: $verifiedTotal,
                    invoicePaid: $invoicePaid,
                );
                return;
            }
            

        });

        return back()->with('success', 'Pembayaran berhasil diverifikasi.');
    }

    public function rejectPayment(Request $request, string $paymentId)
    {
        $request->validate([
            'rejection_note' => ['required', 'string'],
        ]);

        $payment = Payment::findOrFail($paymentId);

        $payment->update([
            'status' => 'rejected',
            'rejection_note' => $request->rejection_note,
            'verified_by' => Auth::user()->id,
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Pembayaran ditolak.');
    }

    public function update(Request $request, string $paymentId, InvoiceService $invoiceService)
    {
        $request->validate([
            'tgl_bayar' => ['required', 'date'],
            'jumlah_bayar' => ['required', 'numeric', 'min:1'],
            'metode_pembayaran' => ['required', 'string'],
            'bukti_transfer' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
            'catatan_finance' => ['nullable', 'string'],
        ]);

        $payment = Payment::with('invoice.sample.pesanan.workflowStatus')->findOrFail($paymentId);

        if (! in_array($payment->status, ['pending', 'rejected'])) {
            abort(422, 'Payment yang sudah terverifikasi tidak bisa diedit.');
        }

        DB::transaction(function () use ($request, $payment, $invoiceService) {
            $path = $payment->bukti_transfer_path;

            if ($request->hasFile('bukti_transfer')) {
                if ($payment->bukti_transfer_path) {
                    Storage::disk('public')->delete($payment->bukti_transfer_path);
                }

                $path = $request->file('bukti_transfer')->store('payments', 'public');
            }

            $payment->update([
                'tgl_bayar' => $request->tgl_bayar,
                'jumlah_bayar' => $request->jumlah_bayar,
                'metode_pembayaran' => $request->metode_pembayaran,
                'bukti_transfer_path' => $path,
                'catatan_finance' => $request->catatan_finance,
                'status' => 'pending',
                'rejection_note' => null,
                'verified_by' => null,
                'verified_at' => null,
            ]);

            $invoice = $invoiceService->recalculateStatus($payment->invoice);

            $sample = $invoice->sample;

            if ($sample && ! in_array($invoice->status_tagihan, ['paid', 'Paid']) ) {
                $sample->update([
                    'status' => 'waiting_payment',
                    'paid_at' => null,
                ]);

                $sample->pesanan->workflowStatus()->update([
                    'sample_paid' => false,
                ]);
            }

            $sample?->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'payment_updated',
                'user_id' => Auth::user()->id,
                'notes' => 'Payment sample diperbarui dan kembali menjadi pending.',
            ]);
        });

        return back()->with('success', 'Payment berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $paymentId, InvoiceService $invoiceService)
    {
        $payment = Payment::with('invoice.sample.pesanan.workflowStatus')->findOrFail($paymentId);

        if (! in_array($payment->status, ['pending', 'rejected'])) {
            abort(422, 'Payment yang sudah terverifikasi tidak bisa dihapus.');
        }

        DB::transaction(function () use ($payment, $invoiceService) {
            $invoice = $payment->invoice;
            $sample = $invoice->sample;

            if ($payment->bukti_transfer_path) {
                Storage::disk('public')->delete($payment->bukti_transfer_path);
            }

            $payment->delete();

            $invoice = $invoiceService->recalculateStatus($invoice);

            if ($sample && ! in_array($invoice->status_tagihan, ['paid', 'Paid'])) {
                $sample->update([
                    'status' => 'waiting_payment',
                    'paid_at' => null,
                ]);

                $sample->pesanan->workflowStatus()->update([
                    'sample_paid' => false,
                ]);
            }

            $sample?->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'payment_deleted',
                'user_id' => Auth::user()->id,
                'notes' => 'Payment sample dihapus.',
            ]);
        });

        return back()->with('success', 'Payment berhasil dihapus.');
    }
}
