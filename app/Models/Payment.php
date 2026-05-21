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
        'status',
        'rejection_note',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'tgl_bayar' => 'date',
        'verified_at' => 'datetime',
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
