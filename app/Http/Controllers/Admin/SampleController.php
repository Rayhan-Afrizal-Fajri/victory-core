<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\Sample;
use App\Models\SampleMedia;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
                    'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
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

    public function update(Request $request, string $sampleId, InvoiceService $invoiceService)
    {
        $request->validate([
            'qty' => ['required', 'integer', 'min:1'],
            'sample_price' => ['required', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string'],
            'is_chargeable' => ['required', 'boolean'],
        ]);

        $sample = Sample::with([
            'invoice.payments',
            'pesanan.workflowStatus',
        ])->findOrFail($sampleId);

        if (! in_array($sample->status, ['waiting_payment', 'paid'])) {
            abort(422, 'Sample tidak bisa diedit karena sudah masuk proses berikutnya.');
        }

        $hasVerifiedPayment = $sample->invoice?->payments()
            ->where('status', 'verified')
            ->exists();

        if ($hasVerifiedPayment) {
            abort(422, 'Sample tidak bisa diedit karena sudah memiliki payment terverifikasi.');
        }

        DB::transaction(function () use ($request, $sample, $invoiceService) {
            $sample->update([
                'qty' => $request->qty,
                'sample_price' => $request->sample_price,
                'is_chargeable' => $request->boolean('is_chargeable'),
                'catatan' => $request->catatan,
            ]);

            if ($request->boolean('is_chargeable')) {
                if ($sample->invoice) {
                    $sample->invoice->update([
                        'total_tagihan' => $request->sample_price,
                    ]);

                    $invoiceService->recalculateStatus($sample->invoice);
                } else {
                    $invoice = $sample->pesanan->invoices()->create([
                        'no_invoice' => $invoiceService->generate('SAMPLE'),
                        'kategori_invoice' => 'sample',
                        'total_tagihan' => $request->sample_price,
                        'status_tagihan' => 'unpaid',
                        'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
                    ]);

                    $sample->update([
                        'invoice_id' => $invoice->id,
                        'status' => 'waiting_payment',
                        'paid_at' => null,
                    ]);

                    $sample->pesanan->workflowStatus()->update([
                        'sample_paid' => false,
                    ]);
                }
            } else {
                if ($sample->invoice) {
                    $sample->invoice->update([
                        'status_tagihan' => 'cancelled',
                    ]);
                }

                $sample->update([
                    'invoice_id' => null,
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                $sample->pesanan->workflowStatus()->update([
                    'sample_paid' => true,
                ]);
            }

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'updated',
                'user_id' => Auth::user()->id,
                'notes' => 'Data sample diperbarui.',
            ]);
        });

        return back()->with('success', 'Sample berhasil diperbarui.');
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

    public function approve(string $sampleId, InvoiceService $invoiceService)
    {
        $sample = Sample::with('pesanan.workflowStatus')->findOrFail($sampleId);

        if ($sample->status !== 'delivered') {
            abort(422, 'Sample hanya bisa disetujui setelah diterima customer.');
        }

        DB::transaction(function () use ($sample, $invoiceService) {
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
            $pesanan = $sample->pesanan;
            $total_tagihan = $pesanan->q * ($pesanan->harga_jual_per_pcs);
            $pesanan->invoices()->create([
                'no_invoice' => $invoiceService->generate('PRODUCTION'),
                'kategori_invoice' => 'production',
                'total_tagihan' => $total_tagihan,
                'status_tagihan' => 'unpaid',
                'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
            ]);
            $pesanan->workflowStatus()->update([
                'production_invoice_created' => true
            ]);
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

    public function destroy(string $sampleId)
    {
        $sample = Sample::with([
            'invoice.payments',
            'media',
            'delivery',
            'pesanan.workflowStatus',
        ])->findOrFail($sampleId);

        if (! in_array($sample->status, ['waiting_payment', 'paid'])) {
            abort(422, 'Sample tidak bisa dihapus karena sudah masuk proses berikutnya.');
        }

        if ($sample->delivery) {
            abort(422, 'Sample tidak bisa dihapus karena sudah memiliki data pengiriman.');
        }

        $hasVerifiedPayment = $sample->invoice?->payments()
            ->where('status', 'verified')
            ->exists();

        if ($hasVerifiedPayment) {
            abort(422, 'Sample tidak bisa dihapus karena sudah memiliki payment terverifikasi.');
        }

        DB::transaction(function () use ($sample) {
            $pesanan = $sample->pesanan;

            foreach ($sample->media as $media) {
                if ($media->file_path) {
                    Storage::disk('public')->delete($media->file_path);
                }

                $media->delete();
            }

            if ($sample->invoice) {
                foreach ($sample->invoice->payments as $payment) {
                    if ($payment->bukti_transfer_path) {
                        Storage::disk('public')->delete($payment->bukti_transfer_path);
                    }

                    $payment->delete();
                }

                $sample->invoice->delete();
            }

            $sample->delete();

            $latestSample = $pesanan->samples()
                ->latest()
                ->first();

            $pesanan->workflowStatus()->update([
                'sample_created' => Boolean($latestSample),
                'sample_paid' => $latestSample
                    ? in_array($latestSample->status, ['paid', 'in_delivery', 'delivered', 'approved'])
                    : false,
                'sample_delivered' => $latestSample
                    ? in_array($latestSample->status, ['delivered', 'approved'])
                    : false,
                'sample_approved' => $latestSample
                    ? $latestSample->status === 'approved'
                    : false,
            ]);

            $pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'deleted',
                'user_id' => Auth::user()->id,
                'notes' => 'Sample dihapus.',
            ]);
        });

        return back()->with('success', 'Sample berhasil dihapus.');
    }


    /**
     * Delivery
     */

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

    public function updateDelivery(Request $request, string $sampleId)
    {
        $request->validate([
            'courier_name' => ['required', 'string'],
            'tracking_number' => ['nullable', 'string'],
            'tracking_url' => ['nullable', 'url'],
            'delivery_note' => ['nullable', 'string'],
        ]);

        $sample = Sample::with(['delivery', 'pesanan.workflowStatus'])->findOrFail($sampleId);

        if ($sample->status !== 'in_delivery') {
            abort(422, 'Delivery hanya bisa diedit saat sample dalam proses pengiriman.');
        }

        if (! $sample->delivery) {
            abort(422, 'Data delivery belum tersedia.');
        }

        if ($sample->delivery->status === 'delivered') {
            abort(422, 'Delivery yang sudah diterima tidak bisa diedit.');
        }

        DB::transaction(function () use ($request, $sample) {
            $sample->delivery->update([
                'courier_name' => $request->courier_name,
                'tracking_number' => $request->tracking_number,
                'tracking_url' => $request->tracking_url,
                'delivery_note' => $request->delivery_note,
            ]);

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'delivery_updated',
                'user_id' => Auth::user()->id,
                'notes' => 'Data pengiriman sample diperbarui.',
            ]);
        });

        return back()->with('success', 'Delivery sample berhasil diperbarui.');
    }

    public function cancelDelivery(string $sampleId)
    {
        $sample = Sample::with(['delivery', 'pesanan.workflowStatus'])->findOrFail($sampleId);

        if ($sample->status !== 'in_delivery') {
            abort(422, 'Delivery hanya bisa dibatalkan saat sample dalam proses pengiriman.');
        }

        if (! $sample->delivery) {
            abort(422, 'Data delivery belum tersedia.');
        }

        if ($sample->delivery->status === 'delivered') {
            abort(422, 'Delivery yang sudah diterima tidak bisa dibatalkan.');
        }

        DB::transaction(function () use ($sample) {
            $sample->delivery->delete();

            $sample->update([
                'status' => 'paid',
                'sent_at' => null,
            ]);

            $sample->pesanan->workflowStatus()->update([
                'sample_delivered' => false,
            ]);

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'delivery_cancelled',
                'user_id' => Auth::user()->id,
                'notes' => 'Pengiriman sample dibatalkan. Sample kembali ke status paid.',
            ]);
        });

        return back()->with('success', 'Delivery sample berhasil dibatalkan.');
    }

    //media destroy
    public function deleteMedia(string $mediaId)
    {
        $media = SampleMedia::with('sample.pesanan')->findOrFail($mediaId);

        $sample = $media->sample;

        if (in_array($sample->status, ['approved', 'rejected'])) {
            abort(422, 'Foto sample tidak bisa dihapus karena sample sudah final.');
        }

        DB::transaction(function () use ($media, $sample) {
            if ($media->file_path) {
                Storage::disk('public')->delete($media->file_path);
            }

            $media->delete();

            $sample->pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'media_deleted',
                'user_id' => Auth::user()->id,
                'notes' => 'Foto sample dihapus.',
            ]);
        });

        return back()->with('success', 'Foto sample berhasil dihapus.');
    }
}