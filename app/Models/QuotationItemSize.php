<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItemSize extends Model
{
    protected $fillable = [
        'quotation_item_id',
        'size_label',
        'qty',
        'price_per_pcs',
        'sub_total',
    ];

    public function quotationItem(): BelongsTo
    {
        return $this->belongsTo(QuotationItem::class);
    }
}
