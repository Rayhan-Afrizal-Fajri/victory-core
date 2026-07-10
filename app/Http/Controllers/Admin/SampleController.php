<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
// use App\Models\Pesanan;
use App\Models\Sample;
use App\Models\SampleMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SampleController extends Controller
{
    /**
     * Mengunggah foto dokumentasi hasil sample berdasarkan ID Sample
     */
    public function storeMedia(Request $request, Sample $sample)
    {
        // Hanya fokus pada validasi foto
        $request->validate([
            'photos' => ['required', 'array', 'min:1'],
            'photos.*' => ['image', 'max:4096'],
        ]);

        // Load relasi yang dibutuhkan
        $sample->loadMissing('pesanan.jobTicket');

        DB::transaction(function () use ($request, $sample) {
            // Simpan setiap foto yang diunggah
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $path = $photo->store('samples', 'public');
                    
                    $sample->media()->create([
                        'sample_id' => $sample->id,
                        'file_path' => $path,
                    ]);
                }
            }

            // Update status workflow
            $sample->pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $sample->pesanan_id],
                ['sample_uploaded' => true]
            );

            // Catat riwayat
            $sample->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'media_uploaded',
                'user_id' => Auth::id(),
                'notes' => 'Foto dokumentasi hasil sample telah diunggah.',
            ]);
        });

        return back()->with('success', 'Foto sample berhasil diunggah.');
    }

    /**
     * Menghapus foto dokumentasi sample
     */
    public function deleteMedia(string $mediaId)
    {
        $media = SampleMedia::with('sample.pesanan')->findOrFail($mediaId);
        $sample = $media->sample;

        DB::transaction(function () use ($media, $sample) {
            // Hapus file fisik
            if ($media->file_path) {
                Storage::disk('public')->delete($media->file_path);
            }

            // Hapus record di database
            $media->delete();

            // CEK SISA FOTO: Jika fotonya habis (0), maka ubah status workflow jadi false
            if ($sample->media()->count() === 0) {
                $sample->pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $sample->pesanan_id],
                    ['sample_uploaded' => false]
                );
            }

            $sample->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'media_deleted',
                'user_id' => Auth::id(),
                'notes' => 'Foto dokumentasi sample dihapus.',
            ]);
        });

        return back()->with('success', 'Foto sample berhasil dihapus.');
    }

    public function start(Sample $sample)
    {
        $sample->update([
            'status' => 'in_production',
            'started_at' => now(),
        ]);

        $sample->pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $sample->pesanan_id],
            ['sample_started' => true]
        );

        return back()->with('success', 'Produksi sample dimulai.');
    }

    public function complete(Sample $sample)
    {
        $sample->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $sample->pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $sample->pesanan_id],
            ['sample_completed' => true]
        );

        return back()->with('success', 'Produksi sample selesai.');
    }

    /**
     * Memproses Pengiriman (Shipment) Sample
     */
    public function ship(Request $request, string $id)
    {
        $request->validate([
            'courier_name' => 'required|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
            'tracking_url' => 'nullable|url|max:255',
            'delivery_note' => 'nullable|string',
        ]);

        $sample = Sample::with('pesanan.jobTicket')->findOrFail($id);

        DB::transaction(function () use ($request, $sample) {
            // Buat atau update data delivery
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

            // Ubah status sample menjadi in_delivery
            $sample->update(['status' => 'in_delivery']);

            $sample->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'sample_shipped',
                'user_id' => Auth::id(),
                'notes' => "Sample dikirim menggunakan kurir {$request->courier_name}.",
            ]);
        });

        return back()->with('success', 'Sample berhasil ditandai sedang dikirim.');
    }

    /**
     * Menandai Sample sudah sampai ke tangan customer
     */
    public function markDelivered(string $id)
    {
        $sample = Sample::with(['pesanan.jobTicket', 'delivery'])->findOrFail($id);

        DB::transaction(function () use ($sample) {
            // Update waktu terima di delivery
            if ($sample->delivery) {
                $sample->delivery()->update([
                    'status' => 'delivered',
                    'received_at' => now()
                ]);
            }

            // Update status sample
            $sample->update(['status' => 'delivered']);

            // Update Workflow
            $sample->pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $sample->pesanan_id],
                ['sample_delivered' => true]
            );

            $sample->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'sample_delivered',
                'user_id' => Auth::id(),
                'notes' => 'Sample telah diterima oleh customer.',
            ]);
        });

        return back()->with('success', 'Sample ditandai telah diterima.');
    }

    /**
     * Customer Menyetujui (Approve) Sample
     */
    public function approve(string $id)
    {
        $sample = Sample::with('pesanan.jobTicket')->findOrFail($id);

        DB::transaction(function () use ($sample) {
            $sample->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::id(),
            ]);

            $sample->pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $sample->pesanan_id],
                ['sample_approved' => true]
            );

            $sample->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'sample_approved',
                'user_id' => Auth::id(),
                'notes' => 'Customer telah menyetujui sample.',
            ]);
        });

        return back()->with('success', 'Sample berhasil di-approve. Siap untuk produksi massal.');
    }

    /**
     * Customer Meminta Revisi Sample (Mereset Workflow)
     */
    public function requestRevision(Request $request, string $id)
    {
        $request->validate([
            'customer_review_note' => 'required|string',
        ]);

        $sample = Sample::with('pesanan.jobTicket')->findOrFail($id);
        $pesanan = $sample->pesanan;

        DB::transaction(function () use ($request, $sample, $pesanan) {
            // 1. Tandai sample saat ini butuh revisi
            $sample->update([
                'status' => 'revision_needed',
                'customer_review_note' => $request->customer_review_note,
            ]);

            // 2. Mundurkan seluruh proses workflow ke tahap desain
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'design_uploaded' => false, 
                    'design_approved' => false,
                    'article_synced' => false,
                    'design_specs_completed' => false,
                    'price_approved' => false,
                    'quotation_created' => false,
                    'quotation_approved' => false,
                    
                    // Reset semua flag sample agar bisa dibuatkan sample baru nanti
                    'sample_paid' => false,
                    'sample_created' => false,
                    'sample_started' => false,
                    'sample_completed' => false,
                    'sample_uploaded' => false,
                    'sample_delivered' => false,
                    'sample_approved' => false,
                    'sample_revision' => true, // Tandai bahwa sample butuh revisi
                ]
            );

            // Opsional: Jika Anda punya field catatan revisi di tabel Pesanan/Desain, bisa disave di sini agar Designer baca.
            $pesanan->designs()->where('status', 'approved')->latest()->first()->update(['revision_needed' => true, 'revision_note' => $request->customer_review_note]);

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'sample_revision_requested',
                'user_id' => Auth::id(),
                'notes' => "Customer meminta revisi sample. Catatan: {$request->customer_review_note}. Workflow dikembalikan ke tahap desain.",
            ]);
        });

        return back()->with('success', 'Permintaan revisi berhasil. Proses dikembalikan ke tahap desain.');
    }

    /**
     * Customer Menolak (Reject) Sample dan Membatalkan Pesanan
     */
    public function reject(Request $request, string $id)
    {
        $request->validate([
            'customer_review_note' => 'required|string',
        ]);

        $sample = Sample::with('pesanan.jobTicket')->findOrFail($id);
        $pesanan = $sample->pesanan;

        DB::transaction(function () use ($request, $sample, $pesanan) {
            // Tandai sample direject
            $sample->update([
                'status' => 'rejected',
                'customer_review_note' => $request->customer_review_note,
            ]);

            // Karena project batal, hentikan workflow (Bisa disesuaikan dengan skema database Anda)
            // Asumsi: Kita buat flag `completed` true namun dengan status batal di tabel utama
            
            // $pesanan->update(['status' => 'cancelled']); // Jika ada kolom status di tabel pesanan

            // Atau cukup update flag workflow untuk menutup job ticket
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'completed' => true, 
                ]
            );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'sample_rejected',
                'user_id' => Auth::id(),
                'notes' => "Customer menolak sample dan membatalkan pesanan. Catatan: {$request->customer_review_note}.",
            ]);
        });

        return back()->with('success', 'Sample ditolak. Proses produksi untuk artikel ini dihentikan.');
    }
}