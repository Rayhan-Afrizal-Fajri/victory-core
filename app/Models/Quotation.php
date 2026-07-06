<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    protected $fillable = [
        'job_ticket_id',
        'quotation_number',
        'status',
        'valid_until',
        'sample_qty',
        'payment_terms',
        'delivery_terms',
        'notes',
        'price_per_pcs',
        'quantity',
        'subtotal',
        'tax',
        'delivery_cost',
        'grand_total',
        'approved_at',
        'approved_by_name',
        'signature_path',
        'pdf_path',
        'created_by',
    ];

    protected $casts = [
        'valid_until' => 'date',
        'approved_at' => 'datetime',
    ];

    public function jobTicket()
    {
        return $this->belongsTo(JobTicket::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function quotationNotes()
    {
        return $this->hasMany(QuotationNote::class);
    }
}
