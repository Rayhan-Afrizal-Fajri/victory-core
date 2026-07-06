<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationNote extends Model
{
    protected $fillable = [
        'quotation_id',
        'notes'
    ];

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }
}
