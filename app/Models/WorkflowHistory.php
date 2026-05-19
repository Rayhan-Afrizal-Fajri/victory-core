<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowHistory extends Model
{
    protected $fillable = [
        'pesanan_id',
        'step',
        'action',
        'user_id',
        'notes',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
