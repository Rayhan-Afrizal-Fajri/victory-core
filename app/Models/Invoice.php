<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'pesanan_id',
        'no_invoice',
        'tipe_invoice',
        'total_tagihan',
        'status_tagihan',
        'tgl_jatuh_tempo',
    ];


    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function payment()
    {
        return $this->hasMany(Payment::class);
    }
}
