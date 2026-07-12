<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductMaterial extends Model
{
    protected $fillable = [
        'product_id',
        'material_id',
        'default_supplier_id',
        'harga_ecer',
        'harga_roll',
        'type',
        'default_usage',
        'default_unit',
        'default_color',
        'sort_order',
        'is_required',
    ];

    public function defaultSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'default_supplier_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
