<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionQcLog extends Model
{
    protected $fillable = [
        'production_run_process_id',
        'checked_qty',
        'passed_qty',
        'defect_qty',
        'defect_reason',
        'corrective_action',
        'qc_type',
        'checked_by'
    ];

    public function productionRunProcess() {
        return $this->belongsTo(ProductionRunProcess::class);
    }

    public function checkedBy()
    {
        return $this->belongsTo(User::class, 'checked_by');
    }
}
