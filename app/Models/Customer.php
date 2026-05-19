<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'nama',
        'no_hp',
        // 'nama_perusahaan',
        'alamat',
    ];

    public function pesanan()
    {
        return $this->hasMany(Pesanan::class);
    }
}
