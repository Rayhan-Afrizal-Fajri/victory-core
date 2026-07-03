<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionRunProcess extends Model
{
    protected $fillable = [
        'production_run_id',
        'pesanan_id',
        'pesanan_manufacturing_spec_id',

        'work_name',
        'sequence',

        'status',
        'started_at',
        'completed_at',

        'quantity',
        'checked_qty',
        'passed_qty',
        'defect_qty',
        
        'qc_status',
        'qc_checked_at',
        'qc_checked_by',
        'qc_notes',
        'corrective_action',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'qc_checked_at' => 'datetime',
    ];

    public function productionRun()
    {
        return $this->belongsTo(ProductionRun::class);
    }

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function pesananManufacturingSpec()
    {
        return $this->belongsTo(PesananManufacturingSpecs::class);
    }

    public function qcCheckedBy()
    {
        return $this->belongsTo(User::class, 'qc_checked_by');
    }

    public function defectHistories()
    {
        return $this->hasMany(ProductionDefectHistory::class);
    }

    public function deffectRuns()
    {
        return $this->hasMany(DeffectRun::class);
    }
}
