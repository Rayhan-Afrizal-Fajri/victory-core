<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionRunProcess extends Model
{
    protected $fillable = [
        'production_run_id',
        'pesanan_manufacturing_spec_id',

        'work_name',
        'sequence',

        'status',
        'started_at',
        'completed_at',

        'checked_qty',
        'passed_qty',
        'defect_qty',
        
        'qc_status',
        'qc_notes',
        'corrective_action',
    ];

    public function productionRun()
    {
        return $this->belongsTo(ProductionRun::class);
    }

    public function pesananManufacturingSpec()
    {
        return $this->belongsTo(PesananManufacturingSpecs::class);
    }
}
