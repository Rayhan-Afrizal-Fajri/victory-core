<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionRun extends Model
{
    protected $fillable = [
        'job_ticket_id',
        'type',
        'status',
        'started_at',
        'completed_at',
        'packing_completed',
        'packed_at',
        'packing_notes',
        'courier_name',
        'tracking_url',
        'tracking_number',
        'delivery_note',
        'customer_review_note',
        'approved_at',
    ];

    public function jobTicket()
    {
        return $this->belongsTo(JobTicket::class);
    }

    public function processes()
    {
        return $this->hasMany(ProductionRunProcess::class);
    }
}
