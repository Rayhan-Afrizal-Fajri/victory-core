<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductCategory extends Model
{
    protected $fillable = [
        'name', //T-Shirt, Totte Bag, etc
    ];

    public function materials(): HasMany
    {
        return $this->hasMany(ProductCategoryMaterial::class);
    }

    public function manufacturingWorks(): HasMany
    {
        return $this->hasMany(ProductCategoryManufacturingWork::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
