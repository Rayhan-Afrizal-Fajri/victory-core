<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ManufacturingWork extends Model
{
    protected $fillable = [
        'name',
        // 'role_id',
        'default_unit',
        'process_behavior',
        'default_vendor_id',
        'default_min_estimate',
        'default_max_estimate',
        'is_active',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function defaultVendor(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'default_vendor_id');
    }

    public function productManufacturingWorks(): HasMany
    {
        return $this->hasMany(ProductManufacturingWork::class);
    }

    public function pesananManufacturingSpecs(): HasMany
    {
        return $this->hasMany(PesananManufacturingSpecs::class);
    }
}
