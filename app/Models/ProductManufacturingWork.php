<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductManufacturingWork extends Model
{
    protected $fillable = [
        'product_id',
        'manufacturing_work_id',
        'default_usage',
        'default_unit',
        'usage_note',
        'sort_order',
        'is_required',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function manufacturingWork(): BelongsTo
    {
        return $this->belongsTo(ManufacturingWork::class);
    }
}
