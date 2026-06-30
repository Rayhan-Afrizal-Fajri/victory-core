<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\SampleMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SampleController extends Controller
{
    /**
     * Menyimpan catatan dan mengunggah foto dokumentasi hasil sample per Pesanan
     */
    public function store(Request $request, string $pesananId)
    {
        $request->validate([
            'catatan' => ['nullable', 'string'],
            'photos' => ['required', 'array', 'min:1'],
            'photos.*' => ['image', 'max:4096'],
        ]);

        $pesanan = Pesanan::with(['workflowStatus'])->findOrFail($pesananId);

        DB::transaction(function () use ($request, $pesanan) {
            // Cek apakah sample record untuk pesanan ini sudah ada
            $sample = $pesanan->samples()->latest()->first();

            if (!$sample) {
                $sample = $pesanan->samples()->create([
                    'status' => 'draft', // Status internal untuk dokumentasi foto
                    'catatan' => $request->catatan,
                ]);
            } else {
                $sample->update([
                    'catatan' => $request->catatan,
                ]);
            }

            // Simpan setiap foto yang diunggah
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $path = $photo->store('samples', 'public');
                    
                    $sample->media()->create([
                        'file_path' => $path,
                    ]);
                }
            }

            // Catat riwayat
            $pesanan->jobTicket->workflowHistory()->create([
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
            if ($media->file_path) {
                Storage::disk('public')->delete($media->file_path);
            }

            $media->delete();

            $sample->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'media_deleted',
                'user_id' => Auth::id(),
                'notes' => 'Foto dokumentasi sample dihapus.',
            ]);
        });

        return back()->with('success', 'Foto sample berhasil dihapus.');
    }
}