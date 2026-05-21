<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use Illuminate\Http\Request;

class OrderSpecificationController extends Controller
{
    public function updateSync(Request $request,string $id)
    {
        $request->validate([
            'specs' => 'array',
            'specs.*.jenis_spesifikasi' => 'required|string|max:255',
            'specs.*.value' => 'required|string',
        ]);

        $pesanan = Pesanan::findOrFail($id);

        // Hapus spesifikasi lama dan masukkan yang baru agar sinkron dengan form dinamis
        $pesanan->orderSpecification()->delete();
        
        if (!empty($request->specs)) {
            $pesanan->orderSpecification()->createMany($request->specs);
        }

        return back()->with('success', 'Spesifikasi produk berhasil diperbarui.');
    }
}