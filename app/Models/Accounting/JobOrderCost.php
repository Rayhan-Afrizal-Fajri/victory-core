<?php

namespace App\Models\Accounting;

use App\Models\JobTicket;
use App\Models\Pesanan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobOrderCost extends Model
{
    use HasFactory;

    protected $table = 'job_order_costs';

    protected $fillable = [
        'pesanan_id',
        'job_ticket_id',
        'estimated_material_cost',
        'actual_material_cost',
        'estimated_labor_cost',
        'actual_labor_cost',
        'estimated_subcon_cost',
        'actual_subcon_cost',
        'defect_scrap_cost',
        'total_estimated_cogs',
        'total_actual_cogs',
        'revenue_billed',
        'gross_profit',
        'gross_margin_pct',
        'status',
    ];

    protected $casts = [
        'estimated_material_cost' => 'float',
        'actual_material_cost' => 'float',
        'estimated_labor_cost' => 'float',
        'actual_labor_cost' => 'float',
        'estimated_subcon_cost' => 'float',
        'actual_subcon_cost' => 'float',
        'defect_scrap_cost' => 'float',
        'total_estimated_cogs' => 'float',
        'total_actual_cogs' => 'float',
        'revenue_billed' => 'float',
        'gross_profit' => 'float',
        'gross_margin_pct' => 'float',
    ];

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(Pesanan::class, 'pesanan_id');
    }

    public function jobTicket(): BelongsTo
    {
        return $this->belongsTo(JobTicket::class, 'job_ticket_id');
    }
}
