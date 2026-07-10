<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model
{
    protected $table = 'pesanan';
    protected $fillable = [
        'job_ticket_id',
        // 'customer_id',
        'product_id',
        // 'customer_nama_snapshot',
        // 'customer_perusahaan_snapshot',
        // 'created_by',
        'date',
        // 'no_job_ticket',
        'produk',
        'requested_product_name',
        'q',
        'qs',
        'sample_qty',
        // 'deadline',
        'harga_jual_per_pcs',
        'harga_sample_per_pcs',
        'estimasi_hpp_per_pcs',
        'keterangan_tambahan',    
        'article_synced_at',
        'article_synced_by',    
    ];

    protected $casts = [
        'deadline' => 'date',
    ];

    public function jobTicket()
    {
        return $this->belongsTo(JobTicket::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function productionRuns()
    {
        return $this->hasMany(ProductionRun::class);
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

    public function quotationItems()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function latestQuotation()
    {
        return $this->hasOne(Quotation::class, 'pesanan_id')->latestOfMany();
    }

    public function productionRunProcesses()
    {
        return $this->hasMany(ProductionRunProcess::class);
    }    

    public function sampleRun()
    {
        return $this->hasOne(ProductionRun::class, 'pesanan_id')
            ->where('type', 'sample')
            ->latestOfMany();
    }

    public function productionRun()
    {
        return $this->hasOne(ProductionRun::class, 'pesanan_id')
            ->where('type', 'production')
            ->latestOfMany();
    }

    public function canModifyOrderEntry(): bool
    {
        $this->loadMissing([
            'workflowStatus',
            'designs',
            'materialSpecs',
            'manufacturingSpecs',
        ]);

        $workflow = $this->workflowStatus;

        $designStarted = 
            (bool) $workflow?->article_synced ||
            (bool) $workflow?->design_uploaded ||
            (bool) $workflow?->design_approved ||
            $this->designs->isNotEmpty() ||
            $this->materialSpecs->isNotEmpty() ||
            $this->manufacturingSpecs->isNotEmpty();

        return ! $designStarted;
    }

    public function defectHistories()
    {
        return $this->hasMany(ProductionDefectHistory::class);
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
