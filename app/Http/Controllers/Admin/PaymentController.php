<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\ProductionRunService;
use App\Services\InvoiceService;
use App\Services\PurchasingService;

class PaymentController extends Controller
{
    public function __construct(
        protected ProductionRunService $productionRunService,
        protected InvoiceService $invoiceService,
        protected PurchasingService $purchasingService,
    ) {}
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
        $invoice = Invoice::findOrFail($invoiceId);
        // $workflowStatus = $invoice->pesanan->workflowStatus;

        $minimumPayment = 1;
        $maximumPayment = $invoice->total_tagihan - $this->getVerifiedTotal($invoice);

        $request->validate([
            'tgl_bayar' => ['required', 'date'],
            'jumlah_bayar' => ['required', 'numeric', 'min:' . $minimumPayment, 'max:' . $maximumPayment],
            'metode_pembayaran' => ['required', 'string'],
            'bukti_transfer' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
            'catatan_finance' => ['nullable', 'string'],
        ]);


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

        $usersToNotify = User::permission('invoices.pay')->get();
        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Verifikasi Pembayaran',
                "Invoice {$invoice->no_invoice} telah dibayar, lakukan verifikasi.",
                "/job-tickets/{$invoice->job_ticket_id}?tab=invoices",
                'info'
            ));
        }

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

            $pesanan->jobTicket->workflowHistory()->create([
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

            // $pesanan->jobTicket->workflowHistory()->create([
            //     'step' => 'sample',
            //     'action' => 'payment_verified',
            //     'user_id' => Auth::user()->id,
            //     'notes' => 'Invoice sample lunas. Purchasing untuk sample dan production sudah dapat dimulai.',
            // ]);
        });
    }

    private function handleProductionInvoicePaymentStatus(
        Invoice $invoice
    ): void
    {
        $jobTicket = $invoice->jobTicket;

        if (! $jobTicket) {
            return;
        }

        $jobTicket->loadMissing([
            'pesanans.workflowStatus',
            'pesanans.productionRuns',
        ]);

        $totalInvoice = (float) $invoice->total_tagihan;

        $verifiedAmount = (float) $invoice
            ->payments()
            ->where('status', 'verified')
            ->sum('jumlah_bayar');

        $dpLimit = $totalInvoice * 0.5;

        $productionDpPaid =
            $totalInvoice > 0 &&
            $verifiedAmount >= $dpLimit;

        $finalPaymentPaid =
            $totalInvoice > 0 &&
            $verifiedAmount >= $totalInvoice;

        $dpJustVerified = false;
        $fullyPaidJustNow = false;

        foreach ($jobTicket->pesanans as $pesanan) {

            $workflow = $pesanan->workflowStatus;

            $wasDpPaid =
                (bool) optional($workflow)->production_dp_paid;

            $wasFullyPaid =
                (bool) optional($workflow)->final_payment_paid;

            $workflow = $pesanan->workflowStatus()->updateOrCreate(
                [
                    'pesanan_id' => $pesanan->id,
                ],
                [
                    'production_dp_paid' => $productionDpPaid,
                    'final_payment_paid' => $finalPaymentPaid,
                ]
            );

            if ($productionDpPaid && ! $wasDpPaid) {
                $dpJustVerified = true;
            }

            if ($finalPaymentPaid && ! $wasFullyPaid) {
                $fullyPaidJustNow = true;
            }

            if (
                !$workflow->completed &&
                $workflow->delivered &&
                $workflow->final_payment_paid
            ) {

                $workflow->update([
                    'completed' => true,
                ]);
            }
        }

        if ($dpJustVerified) {

            $jobTicket->workflowHistory()->create([
                'step' => 'finance',
                'action' => 'production_dp_verified',
                'user_id' => Auth::id(),
                'notes' => 'DP produksi minimal 50% telah terpenuhi.',
            ]);
        }

        if ($fullyPaidJustNow) {

            $jobTicket->workflowHistory()->create([
                'step' => 'finance',
                'action' => 'production_paid',
                'user_id' => Auth::id(),
                'notes' => 'Invoice produksi telah lunas.',
            ]);

            $jobTicket->update([
                'status' => 'Done',
            ]);
        }
    }

    private function handleSampleInvoicePaymentStatus(
        Invoice $invoice
    ): void
    {
        $jobTicket = $invoice->jobTicket;

        if (! $jobTicket) {
            return;
        }

        $isPurchasingGenerated = false;

        foreach ($jobTicket->pesanans as $pesanan) {

            $workflow = $pesanan->workflowStatus;

            $alreadyPaid =
                (bool) optional($workflow)->sample_paid;

            $pesanan->workflowStatus()->updateOrCreate(
                [
                    'pesanan_id'=>$pesanan->id,
                ],
                [
                    'sample_paid'=>true,
                ]
            );

            if (! $alreadyPaid) {

                $jobTicket->workflowHistory()->create([
                    'step'=>'finance',
                    'action'=>'sample_paid',
                    'user_id'=>Auth::id(),
                    'notes'=>'Invoice sample telah dibayar.',
                ]);
            }

           $pesanan->load('workflowStatus');

            // --- TRIGGER OTOMATIS GENERATE PURCHASING DI SINI ---
            // Panggil service yang sudah dibuat
            $generated = $this->purchasingService->generateFromBom($pesanan);
            
            if ($generated) {
                $isPurchasingGenerated = true;
            }
        }

        // 2. Sesuaikan Notifikasi
        // Karena PO sekarang sudah otomatis terbuat, kita ganti pesan notifikasinya
        // Mengarah langsung ke user purchasing untuk *memesan* barang, bukan men-generate lagi.
        if ($isPurchasingGenerated) {
            $usersToNotify = User::permission('purchasings.mark_ordered')->get(); // Sesuaikan permission
            
            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new SystemNotification(
                    'Purchasing BOM Otomatis Dibuat',
                    "Invoice {$invoice->no_invoice} telah lunas. Purchasing untuk pesanan {$jobTicket->no_job_ticket} telah otomatis terbuat. Silakan lakukan pemesanan.",
                    "/job-tickets/{$jobTicket->id}?tab=purchasing",
                    'info'
                ));
            }
        } else {
            $usersToNotify = User::permission('purchasings.generate')->get();
            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new SystemNotification(
                    'Buat kebutuhan Pesanan',
                    "Invoice {$invoice->no_invoice} telah dibayar, lakukan purchasing.",
                    "/job-tickets/{$jobTicket->id}?tab=purchasing",
                    'info'
                ));
            }
        }
    }

    public function verifyPayment(string $paymentId)
    {
        $payment = Payment::with([
            'invoice.jobTicket.pesanans.workflowStatus',
        ])->findOrFail($paymentId);

        if ($payment->status === 'verified') {
            abort(422, 'Payment sudah diverifikasi sebelumnya.');
        }

        DB::transaction(function () use ($payment) {

            $payment->update([
                'status' => 'verified',
                'verified_by' => Auth::id(),
                'verified_at' => now(),
                'rejection_note' => null,
            ]);

            $invoice = $payment->invoice;

            // Selalu hitung ulang status invoice
            $invoice = $this->invoiceService
                ->recalculateStatus($invoice);

            switch ($invoice->kategori_invoice) {

                case 'sample':
                    $this->handleSampleInvoicePaymentStatus($invoice);
                    break;

                case 'produksi':
                case 'production':
                case 'dp_produksi':
                    $this->handleProductionInvoicePaymentStatus($invoice);
                    break;
            }

        });

        return back()->with(
            'success',
            'Pembayaran berhasil diverifikasi.'
        );
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
