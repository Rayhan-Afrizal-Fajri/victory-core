<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model
{
    protected $table = 'pesanan';
    protected $fillable = [
        'customer_id',
        'created_by',
        'date',
        'no_job_ticket',
        'produk',
        'q',
        'qs',
        'deadline',
        'harga_jual_per_pcs',
        'estimasi_hpp_per_pcs',
        'keterangan_tambahan',        
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function invoice()
    {
        return $this->hasMany(Invoice::class);
    }

    public function productionProgress()
    {
        return $this->hasOne(ProductionProgress::class);
    }

    public function profitLoss()
    {
        return $this->hasOne(ProfitLoss::class);
    }

    public function purchasing()
    {
        return $this->hasMany(Purchasing::class);
    }

    public function orderSpecification()
    {
        return $this->hasMany(OrderSpecification::class);
    }

    public function design()
    {
        return $this->hasMany(Design::class);
    }

    public function sample()
    {
        return $this->hasMany(Sample::class);
    }

    public function workflowHistory()
    {
        return $this->hasMany(WorkflowHistory::class);
    }

    public function attachment()
    {
        return $this->hasMany(Attachment::class);
    }

    public function workflowStatus()
    {
        return $this->hasOne(WorkflowStatus::class);
    }
}
