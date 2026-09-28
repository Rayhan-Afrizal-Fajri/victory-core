<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function quotationItemSize(): HasMany
    {
        return $this->hasMany(QuotationItemSize::class);
    }
}
