<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sample extends Model
{
    protected $fillable = [
        'pesanan_id',
        'qty',
        'status',
        'catatan',
        'sent_at',
        'approved_at',
        'approved_by',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
