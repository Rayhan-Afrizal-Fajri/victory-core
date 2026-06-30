<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowHistory extends Model
{
    protected $fillable = [
        'job_ticket_id',
        'step',
        'action',
        'user_id',
        'notes',
    ];

    public function jobTicket()
    {
        return $this->belongsTo(JobTicket::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
