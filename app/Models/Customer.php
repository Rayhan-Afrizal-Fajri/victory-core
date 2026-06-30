<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'nama',
        'user_id',
        'no_hp',
        'nama_perusahaan',
        'alamat',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function jobTicket()
    {
        return $this->hasMany(JobTicket::class);
    }
}
