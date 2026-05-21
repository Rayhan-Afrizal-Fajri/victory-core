<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Pesanan;
use App\Models\Sample;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SampleController extends Controller
{
    public function store(Request $request, string $pesananId, InvoiceService $invoiceService)
    {
        $request->validate([
            'qty' => ['required', 'integer', 'min:1'],
            'sample_price' => ['required', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string'],
            'is_chargeable' => ['required', 'boolean'],
            'photos' => ['required', 'array', 'min:1'],
            'photos.*' => ['image', 'max:4096'],
        ]);

        $pesanan = Pesanan::with(['workflowStatus', 'samples'])->findOrFail($pesananId);

        if (! $pesanan->workflowStatus?->design_approved) {
            abort(422, 'Sample belum bisa dibuat karena desain belum disetujui.');
        }

        DB::transaction(function () use ($request, $pesanan, $invoiceService) {
            $latestSample = $pesanan->samples()->latest()->first();

            $invoice = null;

            if ($request->boolean('is_chargeable')) {
                $invoice = $pesanan->invoices()->create([
                    'no_invoice' => $invoiceService->generate('SAMPLE'),
                    'kategori_invoice' => 'sample',
                    'total_tagihan' => $request->sample_price,
                    'status_tagihan' => 'unpaid',
                    'tgl_jatuh_tempo' => now()->addDays(3)->toDateString(),
                ]);
            }

            $sample = $pesanan->samples()->create([
                'qty' => $request->qty,
                'sample_price' => $request->sample_price,
                'invoice_id' => $invoice?->id,
                'parent_sample_id' => $latestSample?->id,
                'revision_number' => $latestSample ? $latestSample->revision_number + 1 : 0,
                'is_chargeable' => $request->boolean('is_chargeable'),
                'status' => $invoice ? 'waiting_payment' : 'paid',
                'catatan' => $request->catatan,
                'created_by' => Auth::user()->id,
                'created_sample_at' => now(),
                'paid_at' => $invoice ? null : now(),
            ]);

            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('samples', 'public');

                $sample->media()->create([
                    'file_path' => $path,
                    'type' => 'image',
                ]);
            }

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'sample_created' => true,
                    'sample_paid' => ! $invoice,
                    'sample_delivered' => false,
                    'sample_approved' => false,
                ]
            );

            $pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'created',
                'user_id' => Auth::user()->id,
                'notes' => $invoice
                    ? 'Sample dibuat dan invoice sample otomatis diterbitkan.'
                    : 'Sample dibuat tanpa invoice sample.',
            ]);
        });

        return back()->with('success', 'Sample berhasil dibuat.');
    }

    public function uploadMedia(Request $request, string $sampleId)
    {
        $request->validate([
            'photos' => ['required', 'array', 'min:1'],
            'photos.*' => ['image', 'max:4096'],
        ]);

        $sample = Sample::findOrFail($sampleId);

        foreach ($request->file('photos') as $photo) {
            $path = $photo->store('samples', 'public');

            $sample->media()->create([
                'file_path' => $path,
                'type' => 'image',
            ]);
        }

        return back()->with('success', 'Media sample berhasil diupload.');
    }

    public function submitPayment(Request $request, string $sampleId)
    {
        $request->validate([
            'tgl_bayar' => ['required', 'date'],
            'jumlah_bayar' => ['required', 'numeric', 'min:1'],
            'metode_pembayaran' => ['required', 'string'],
            'bukti_transfer' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
            'catatan_finance' => ['nullable', 'string'],
        ]);

        $sample = Sample::with('invoice')->findOrFail($sampleId);

        if (! $sample->invoice) {
            abort(422, 'Sample ini tidak memiliki invoice.');
        }

        if ($sample->invoice->status_tagihan === 'paid') {
            abort(422, 'Invoice sample sudah lunas.');
        }

        $path = null;

        if ($request->hasFile('bukti_transfer')) {
            $path = $request->file('bukti_transfer')->store('payments', 'public');
        }

        $sample->invoice->payment()->create([
            'tgl_bayar' => $request->tgl_bayar,
            'jumlah_bayar' => $request->jumlah_bayar,
            'metode_pembayaran' => $request->metode_pembayaran,
            'bukti_transfer_path' => $path,
            'catatan_finance' => $request->catatan_finance,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Pembayaran berhasil dikirim dan menunggu verifikasi finance.');
    }

    public function verifyPayment(string $paymentId, InvoiceService $invoiceService)
    {
        $payment = Payment::with('invoice.sample.pesanan.workflowStatus')->findOrFail($paymentId);

        DB::transaction(function () use ($payment, $invoiceService) {
            $payment->update([
                'status' => 'verified',
                'verified_by' => Auth::user()->id,
                'verified_at' => now(),
                'rejection_note' => null,
            ]);

            $invoice = $invoiceService->recalculateStatus($payment->invoice);

            $sample = $invoice->sample;

            if ($sample && $invoice->status_tagihan === 'paid') {
                $sample->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                $sample->pesanan->workflowStatus()->update([
                    'sample_paid' => true,
                ]);

                $sample->pesanan->workflowHistory()->create([
                    'step' => 'sample',
                    'action' => 'payment_verified',
                    'user_id' => Auth::user()->id,
                    'notes' => 'Pembayaran sample telah diverifikasi dan invoice sample lunas.',
                ]);
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

    public function ship(Request $request, string $sampleId)
    {
        $request->validate([
            'courier_name' => ['required', 'string'],
            'tracking_number' => ['nullable', 'string'],
            'tracking_url' => ['nullable', 'url'],
            'delivery_note' => ['nullable', 'string'],
        ]);

        $sample = Sample::with('pesanan.workflowStatus')->findOrFail($sampleId);

        if (! $sample->pesanan->workflowStatus?->sample_paid) {
            abort(422, 'Sample belum bisa dikirim karena pembayaran belum lunas.');
        }

        if ($sample->status !== 'paid') {
            abort(422, 'Sample hanya bisa dikirim ketika status paid.');
        }

        DB::transaction(function () use ($request, $sample) {
            $sample->delivery()->updateOrCreate(
                ['sample_id' => $sample->id],
                [
                    'courier_name' => $request->courier_name,
                    'tracking_number' => $request->tracking_number,
                    'tracking_url' => $request->tracking_url,
                    'delivery_note' => $request->delivery_note,
                    'status' => 'shipped',
                    'sent_at' => now(),
                ]
            );

            $sample->update([
                'status' => 'in_delivery',
                'sent_at' => now(),
            ]);

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'shipped',
                'user_id' => Auth::user()->id,
                'notes' => 'Sample dikirim ke customer.',
            ]);
        });

        return back()->with('success', 'Sample berhasil dikirim.');
    }

    public function markDelivered(string $sampleId)
    {
        $sample = Sample::with(['pesanan.workflowStatus', 'delivery'])->findOrFail($sampleId);

        if ($sample->status !== 'in_delivery') {
            abort(422, 'Sample belum dalam proses pengiriman.');
        }

        DB::transaction(function () use ($sample) {
            $sample->delivery?->update([
                'status' => 'delivered',
                'received_at' => now(),
            ]);

            $sample->update([
                'status' => 'delivered',
            ]);

            $sample->pesanan->workflowStatus()->update([
                'sample_delivered' => true,
            ]);

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'delivered',
                'user_id' => Auth::user()->id,
                'notes' => 'Sample diterima customer.',
            ]);
        });

        return back()->with('success', 'Sample ditandai sudah diterima.');
    }

    public function approve(string $sampleId)
    {
        $sample = Sample::with('pesanan.workflowStatus')->findOrFail($sampleId);

        if ($sample->status !== 'delivered') {
            abort(422, 'Sample hanya bisa disetujui setelah diterima customer.');
        }

        DB::transaction(function () use ($sample) {
            $sample->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::user()->id,
            ]);

            $sample->pesanan->workflowStatus()->update([
                'sample_approved' => true,
            ]);

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'approved',
                'user_id' => Auth::user()->id,
                'notes' => 'Sample disetujui customer.',
            ]);


            //otomatis create invoice production
        });

        return back()->with('success', 'Sample berhasil disetujui.');
    }

    public function requestRevision(Request $request, string $sampleId)
    {
        $request->validate([
            'customer_review_note' => ['required', 'string'],
        ]);

        $sample = Sample::with('pesanan.workflowStatus')->findOrFail($sampleId);

        if (! in_array($sample->status, ['delivered', 'approved'])) {
            abort(422, 'Sample belum bisa direvisi.');
        }

        DB::transaction(function () use ($request, $sample) {
            $sample->update([
                'status' => 'revision_needed',
                'customer_review_note' => $request->customer_review_note,
                'approved_at' => null,
                'approved_by' => null,
            ]);

            $sample->pesanan->workflowStatus()->update([
                'sample_approved' => false,
            ]);

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'revision_requested',
                'user_id' => Auth::user()->id,
                'notes' => $request->customer_review_note,
            ]);
        });

        return back()->with('success', 'Revisi sample berhasil diminta.');
    }

    public function reject(Request $request, string $sampleId)
    {
        $request->validate([
            'customer_review_note' => ['required', 'string'],
        ]);

        $sample = Sample::with('pesanan.workflowStatus')->findOrFail($sampleId);

        if (! in_array($sample->status, ['delivered', 'approved'])) {
            abort(422, 'Sample belum bisa ditolak.');
        }

        DB::transaction(function () use ($request, $sample) {
            $sample->update([
                'status' => 'rejected',
                'customer_review_note' => $request->customer_review_note,
                'approved_at' => null,
                'approved_by' => null,
            ]);

            $sample->pesanan->workflowStatus()->update([
                'sample_approved' => false,
            ]);

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'rejected',
                'user_id' => Auth::user()->id,
                'notes' => $request->customer_review_note,
            ]);
        });

        return back()->with('success', 'Sample ditolak.');
    }
}