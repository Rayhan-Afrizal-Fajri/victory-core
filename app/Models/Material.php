<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    protected $fillable = [
        'name',
        'category',
        'unit',
        'default_color',
        'description',
        'is_active',
    ];

    public function productMaterials(): HasMany
    {
        return $this->hasMany(ProductMaterial::class);
    }

    public function pesananMaterialSpecs(): HasMany
    {
        return $this->hasMany(PesananMaterialSpecs::class);
    }
}
