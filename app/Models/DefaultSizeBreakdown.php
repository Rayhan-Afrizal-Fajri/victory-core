<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefaultSizeBreakdown extends Model
{
    protected $fillable = [
        'type',
        'label',
        'sequence'
    ];
}
