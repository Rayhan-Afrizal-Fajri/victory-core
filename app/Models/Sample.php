<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sample extends Model
{
    protected $fillable = [
        'pesanan_id',
        'qty',
        'sample_price',
        'invoice_id',
        'parent_sample_id',
        'revision_number',
        'is_chargeable',
        'status',
        'catatan',
        'customer_review_note',
        'internal_note',
        'created_by',
        'created_sample_at',
        'paid_at',
        'sent_at',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'is_chargeable' => 'boolean',
        'created_sample_at' => 'datetime',
        'paid_at' => 'datetime',
        'sent_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function media()
    {
        return $this->hasMany(SampleMedia::class);
    }

    public function delivery()
    {
        return $this->hasOne(SampleDelivery::class);
    }

    public function parentSample()
    {
        return $this->belongsTo(Sample::class, 'parent_sample_id');
    }

    public function revisions()
    {
        return $this->hasMany(Sample::class, 'parent_sample_id');
    }
}
