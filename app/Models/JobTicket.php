<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobTicket extends Model
{
    protected $fillable = [
        'no_job_ticket',
        'date',
        'customer_id',
        'customer_nama_snapshot',
        'customer_perusahaan_snapshot',
        'company_profile_id',
        'deadline',
        'customer_notes',
        'status',
        'created_by',
    ];

    public function companyProfile()
    {
        return $this->belongsTo(CompanyProfile::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pesanans()
    {
        return $this->hasMany(Pesanan::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class);
    }

    public function productionRuns()
    {
        return $this->hasMany(ProductionRun::class);
    }

    public function defectHistories()
    {
        return $this->hasMany(ProductionDefectHistory::class);
    }

    public function workflowHistory()
    {
        return $this->hasMany(WorkflowHistory::class);
    }
}
