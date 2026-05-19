<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialReceiving extends Model
{
    protected $fillable = [
        'purchasing_id',
        'receiver_qty',
        'receiver_at',
        'checked_by',
        'notes',
    ];

    public function purchasing()
    {
        return $this->belongsTo(Purchasing::class);
    }

    public function checkedBy()
    {
        return $this->belongsTo(User::class, 'checked_by');
    }
}
