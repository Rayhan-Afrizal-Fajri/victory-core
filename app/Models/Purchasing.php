<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchasing extends Model
{
    protected $fillable = [
        'pesanan_id',
        'supplier_id',
        'item_bahan',
        'qty_bahan',
        'satuan',
        'harga_satuan',
        'total_harga',
        'is_received',
        'tgl_pembelian',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
