<?php

namespace App\Models\Kpi;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiTarget extends Model
{
    use HasFactory;

    protected $table = 'kpi_targets';

    protected $fillable = [
        'kpi_definition_id',
        'period_type',
        'year',
        'period_number',
        'target_value',
        'set_by',
    ];

    protected $casts = [
        'target_value' => 'float',
    ];

    public function definition(): BelongsTo
    {
        return $this->belongsTo(KpiDefinition::class, 'kpi_definition_id');
    }

    public function setter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'set_by');
    }
}
