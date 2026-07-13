<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'nama','jabatan','no_hp','nama_perusahaan',
        'provinsi', 'kota', 'kecamatan', 'kelurahan', 'alamat_detail'
    ];
    
    public function jobTicket()
    {
        return $this->hasMany(JobTicket::class);
    }
}
