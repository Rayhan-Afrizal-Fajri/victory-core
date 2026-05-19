<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'nama',
        'kategori',
        'kontak',
        'alamat'  
    ];

    public function purchasing()
    {
        return $this->hasMany(Purchasing::class);
    }
}
