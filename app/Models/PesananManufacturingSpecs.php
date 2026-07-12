<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PesananManufacturingSpecs extends Model
{
    protected $table = 'pesanan_manufacturing_specs';

    protected $fillable = [
        'pesanan_id',
        'product_id',
        'manufacturing_work_id',
        'vendor_id',
        'work_name_snapshot',
        'usage',
        'unit',
        'usage_note',
        'process_behavior',
        'min_estimate',
        'max_estimate',
        'sort_order',
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

    public function manufacturingWork(): BelongsTo
    {
        return $this->belongsTo(ManufacturingWork::class, 'manufacturing_work_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'vendor_id');
    }

    public function productionRunProcess()
    {
        return $this->hasMany(ProductionRunProcess::class);
    }
}
