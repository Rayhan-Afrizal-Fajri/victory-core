<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'invoice_id',
        'tgl_bayar',
        'jumlah_bayar',
        'metode_pembayaran',
        'bukti_transfer_path',
        'catatan_finance',  
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
