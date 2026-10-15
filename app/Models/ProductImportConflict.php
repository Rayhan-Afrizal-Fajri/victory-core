<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImportConflict extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'sheet_index',
        'sheet_title',
        'product_name',
        'existing_product_id',
        'separated_product_id',
        'status',
        'matched_fields',
        'previous_data',
        'imported_data',
        'changes_summary',
    ];

    protected $casts = [
        'sheet_index' => 'integer',
        'matched_fields' => 'array',
        'previous_data' => 'array',
        'imported_data' => 'array',
        'changes_summary' => 'array',
    ];

    public function existingProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'existing_product_id');
    }

    public function separatedProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'separated_product_id');
    }
}
