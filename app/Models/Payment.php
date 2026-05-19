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
        'verified_by',
        'verified_at'
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
