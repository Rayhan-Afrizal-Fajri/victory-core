<?php

namespace App\Models\Kpi;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiMetricSnapshot extends Model
{
    use HasFactory;

    protected $table = 'kpi_metric_snapshots';

    protected $fillable = [
        'kpi_definition_id',
        'period_type',
        'period_date',
        'actual_value',
        'target_value',
        'variance',
        'status',
        'metadata',
    ];

    protected $casts = [
        'period_date' => 'date',
        'actual_value' => 'float',
        'target_value' => 'float',
        'variance' => 'float',
        'metadata' => 'array',
    ];

    public function definition(): BelongsTo
    {
        return $this->belongsTo(KpiDefinition::class, 'kpi_definition_id');
    }
}
