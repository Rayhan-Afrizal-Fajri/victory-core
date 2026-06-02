<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderSpecification extends Model
{
    protected $fillable = [
        'pesanan_id',
        'jenis_spesifikasi',
        'key',
        'value',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
