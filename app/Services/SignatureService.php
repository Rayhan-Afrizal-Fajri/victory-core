<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SignatureService
{
    // Nama folder di dalam storage/app/public/
    private $folder = 'signatures';

    public function saveBase64($base64, $oldPath = null)
    {
        if (!$base64 || !str_contains($base64, 'base64')) {
            return $oldPath;
        }

        // Hapus file lama jika ada
        if ($oldPath) {
            $this->deleteOld($oldPath);
        }

        // Bersihkan metadata bawaan canvas HTML
        $image = preg_replace('/^data:image\/\w+;base64,/', '', $base64);
        $image = str_replace(' ', '+', $image);
        
        $fileName = 'signature_' . Str::uuid() . '.png';
        $filePath = $this->folder . '/' . $fileName;
        
        // Decode base64
        $imageData = base64_decode($image);

        // Simpan langsung ke storage/app/public/signatures
        Storage::disk('public')->put($filePath, $imageData);

        // Mengembalikan teks: "signatures/signature_UUID.png" untuk disimpan ke DB
        return $filePath;
    }

    private function deleteOld($oldPath)
    {
        if (!$oldPath) return;

        // Cek dan hapus file dari storage public
        if (Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }
    }
}