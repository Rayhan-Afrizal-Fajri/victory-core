<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowStatus extends Model
{
    protected $fillable = [
        'pesanan_id',
        
        'design_uploaded',
        'design_approved',
        'article_synced',
        'design_specs_completed',
        'price_approved',
        'quotation_created',
        'quotation_approved',

        'sample_paid',
        'sample_created',
        'sample_started',
        'sample_completed',
        'sample_uploaded',
        'sample_delivered',
        'sample_approved',
        'sample_revision',

        'production_invoice_created',
        'production_dp_paid',
        
        'materials_purchased',
        'materials_received',
        'materials_distributed',

        'sample_materials_ready',
        'production_materials_ready',

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
