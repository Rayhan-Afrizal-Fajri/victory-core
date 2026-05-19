<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductionProgress;
use Illuminate\Http\Request;

class ProductionProgressController extends Controller
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
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $progress = ProductionProgress::findOrFail($id);

        $allowedFields = [
            'ppm_bahan',
            'ppm_aksesoris',
            'ppm_cutting',
            'ppm_sablon',
            'ppm_jahit',

            'cut_test_susut',
            'cut_test_luntur',
            'cut_relax_bahan',
            'cut_form_cutting',
            'cut_label_potongan',
            'cut_sisa_bahan',

            'sablon_sample_warna',
            'sablon_test_muntah',

            'jahit_kelengkapan_aksesoris',
            'jahit_titik_kritis',
            'jahit_random_check',

            'qc_steam_packing',
            'qc_sampling_ukuran',
            'qc_inspeksi_jahit',
            'qc_surat_jalan',

            'log_foto_confirm',
            'log_random_cek',
            'log_payment_delivery',
        ];

        $field = collect($request->all())
            ->keys()
            ->first();

        if (!$field || !in_array($field, $allowedFields)) {
            return back()->withErrors([
                'message' => 'Field tidak valid'
            ]);
        }

        $progress->update([
            $field => $request->$field
        ]);

        return back();
    }

    public function toggleSample(string $id)
    {
        $progress = ProductionProgress::findOrFail($id);

        $newValue = !$progress->acc_sample;

        $progress->update([
            'acc_sample' => $newValue,
            'tgl_acc_sample' => $newValue ? now() : null,
        ]);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
