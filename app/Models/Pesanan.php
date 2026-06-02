<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model
{
    protected $table = 'pesanan';
    protected $fillable = [
        'customer_id',
        'product_id',
        'customer_nama_snapshot',
        'customer_perusahaan_snapshot',
        'created_by',
        'date',
        'no_job_ticket',
        'produk',
        'requested_produk_name',
        'q',
        'qs',
        'sample_qty',
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

    public function invoices()
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

    public function designs()
    {
        return $this->hasMany(Design::class);
    }

    public function latestDesign()
    {
        return $this->hasOne(Design::class, 'pesanan_id')->latestOfMany();
    }

    public function samples()
    {
        return $this->hasMany(Sample::class);
    }

    public function latestSample()
    {
        return $this->hasOne(Sample::class, 'pesanan_id')->latestOfMany();
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

    public function sizeBreakdowns()
    {
        return $this->hasMany(PesananSizeBreakdown::class);
    }

    public function materialSpecs()
    {
        return $this->hasMany(PesananMaterialSpecs::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function manufacturingSpecs()
    {
        return $this->hasMany(PesananManufacturingSpecs::class);
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class);
    }

    public function latestQuotation()
    {
        return $this->hasOne(Quotation::class, 'pesanan_id')->latestOfMany();
    }

    public function productionRuns()
    {
        return $this->hasMany(ProductionRun::class);
    }    
}
