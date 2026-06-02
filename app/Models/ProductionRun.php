<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionRun extends Model
{
    protected $fillable = [
        'pesanan_id',
        'type',
        'quantity',
        'status',
        'started_at',
        'completed_at',
        'packing_completed',
        'packed_at',
        'packing_notes',
        'courier_name',
        'tracking_url',
        'delivery_note',
        'customer_review_note',
        'approved_at',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function processes()
    {
        return $this->hasMany(ProductionRunProcess::class);
    }
}
