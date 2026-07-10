<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'job_ticket_id',
        'no_invoice',
        'kategori_invoice',
        'total_tagihan',
        'status_tagihan',
        'tgl_jatuh_tempo',
    ];


    public function jobTicket()
    {
        return $this->belongsTo(JobTicket::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function sample()
    {
        return $this->hasOne(Sample::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
