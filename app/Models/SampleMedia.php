<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SampleMedia extends Model
{
    protected $fillable = [
        'sample_id',
        'file_path',
        'type',
        'caption'
    ];

    public function sample()
    {
        return $this->belongsTo(Sample::class);
    }
}
