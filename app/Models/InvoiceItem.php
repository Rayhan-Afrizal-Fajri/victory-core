<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'pesanan_id',
        'item_name',
        'quantity',
        'price_per_pcs',
        'subtotal',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
