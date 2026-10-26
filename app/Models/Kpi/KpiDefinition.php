<?php

namespace App\Models\Kpi;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KpiDefinition extends Model
{
    use HasFactory;

    protected $table = 'kpi_definitions';

    protected $fillable = [
        'code',
        'name',
        'category',
        'unit',
        'calculation_method',
        'target_value',
        'warning_threshold',
        'danger_threshold',
        'description',
        'is_active',
    ];

    protected $casts = [
        'target_value' => 'float',
        'warning_threshold' => 'float',
        'danger_threshold' => 'float',
        'is_active' => 'boolean',
    ];

    public function snapshots(): HasMany
    {
        return $this->hasMany(KpiMetricSnapshot::class, 'kpi_definition_id');
    }

    public function targets(): HasMany
    {
        return $this->hasMany(KpiTarget::class, 'kpi_definition_id');
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(KpiAlert::class, 'kpi_definition_id');
    }
}
