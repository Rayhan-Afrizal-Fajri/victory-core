<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowStatus extends Model
{
    protected $fillable = [
        'pesanan_id',
        
        'design_uploaded',
        'design_approved',

        'quotation_created',
        'quotation_approved',

        'sample_created',
        'sample_paid',
        'sample_delivered',
        'sample_approved',

        'production_invoice_created',
        'production_dp_paid',
        
        'materials_purchased',
        'materials_received',
        'materials_distributed',

        'production_started',
        'production_completed',
        
        'qc_completed',
        'packing_completed',
        
        'final_payment_paid',
        
        'delivered',
        'completed',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
