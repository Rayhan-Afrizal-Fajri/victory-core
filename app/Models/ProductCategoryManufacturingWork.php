<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductCategoryManufacturingWork extends Model
{
    protected $table = 'category_manufacturing_works';
    protected $fillable = [
        'product_category_id',
        'manufacturing_work_id',
    ];

    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function manufacturingWork(): BelongsTo
    {
        return $this->belongsTo(ManufacturingWork::class);
    }
}
