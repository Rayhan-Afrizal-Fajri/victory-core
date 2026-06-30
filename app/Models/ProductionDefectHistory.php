<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionDefectHistory extends Model
{
    protected $fillable=[
        'job_ticket_id',
        'pesanan_id',
        'production_run_process_id',
        'defect_qty',
        'defect_reason',
        'corrective_action',
        'reported_by'
    ];

    public function jobTicket()
    {
        return $this->belongsTo(JobTicket::class);
    }

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function productionRunProcess()
    {
        return $this->belongsTo(ProductionRunProcess::class);
    }
}
