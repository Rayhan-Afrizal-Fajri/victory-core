<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PesananMaterialSpecs extends Model
{
    protected $table = 'pesanan_material_specs';

    protected $fillable = [
        'pesanan_id',
        'product_id',
        'material_id',
        'supplier_id',
        'type',
        'material_name_snapshot',
        'color',
        'usage',
        'unit',
        'usage_per_set',
        'harga_ecer',
        'harga_roll',
        'price_type',
        'roll_qty',
        'total_usage',
        'total_cost',
        'cost_per_pcs',
    ];

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(Pesanan::class, 'pesanan_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}
