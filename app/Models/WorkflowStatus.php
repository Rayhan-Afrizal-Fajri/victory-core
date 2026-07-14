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

        'purchasing_generated',
        'materials_purchased',
        'materials_received',
        'materials_distributed',

        'sample_materials_ready',
        'production_materials_ready',
        
        'sample_invoice_created',
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
        'final_payment_paid',

        'production_created',
        'production_started',
        'production_completed',
        
        'qc_completed',
        'packing_completed',
        
        'delivered',
        'completed',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
