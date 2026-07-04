<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'category',
        'description',
        'is_active',
        'is_pattern_available',
    ];

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

    public function pesanan()
    {
        return $this->hasMany(Pesanan::class);
    }
}
