<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PesananSizeBreakdown extends Model
{
    protected $fillable = [
        'pesanan_id',
        'color',
        'size_label',
        'fabric_spec',
        'qty',
        'sort_order',
        'harga_jual_per_pcs'
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
