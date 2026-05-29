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
        'default_supplier_id',
        'harga_ecer',
        'harga_roll',
        'roll_qty',
        'roll_unit',
        'is_active',
    ];

    public function defaultSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'default_supplier_id');
    }

    public function productMaterials(): HasMany
    {
        return $this->hasMany(ProductMaterial::class);
    }

    public function pesananMaterialSpecs(): HasMany
    {
        return $this->hasMany(PesananMaterialSpecs::class);
    }
}
