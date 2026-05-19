<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfitLoss extends Model
{
    protected $fillable = [
        'pesanan_id',
        'total_pendapatan',
        'hpp_realisasi',
        'gop',
        'margin_persentase',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
