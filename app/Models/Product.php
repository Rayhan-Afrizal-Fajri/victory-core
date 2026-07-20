<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'name',
        'product_category_id',
        'description',
        'is_active',
        'is_pattern_available',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function productMaterials(): HasMany
    {
        return $this->hasMany(ProductMaterial::class);
    }

    public function productManufacturingWorks(): HasMany
    {
        return $this->hasMany(ProductManufacturingWork::class);
    }

    public function pesananMaterialSpecs(): HasMany
    {
        return $this->hasMany(PesananMaterialSpecs::class);
    }

    public function pesananManufacturingSpecs(): HasMany
    {
        return $this->hasMany(PesananManufacturingSpecs::class);
    }

    public function pesanan(): HasMany
    {
        return $this->hasMany(Pesanan::class);
    }
}
