<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SampleDelivery extends Model
{
    protected $fillable = [
        'sample_id',
        'courier_name',
        'tracking_number',
        'tracking_url',
        'status',
        'sent_at',
        'received_at',
        'delivery_note'
    ];

    public function sample()
    {
        return $this->belongsTo(Sample::class);
    }
}
