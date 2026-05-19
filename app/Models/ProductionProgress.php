<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionProgress extends Model
{
    protected $fillable = [
        'pesanan_id',
        'prioritas',

        'started_at',
        'completed_at',

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
        
        'status_produksi',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
