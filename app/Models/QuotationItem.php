<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationItem extends Model
{
    protected $fillable = [
        'quotation_id',
        'pesanan_id',
        'item_name',
        'fabric',
        'print_method',
        'quantity',
        'price_per_pcs',
        'subtotal',
    ];

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
