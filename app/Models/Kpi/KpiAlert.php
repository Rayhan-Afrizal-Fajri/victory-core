<?php

namespace App\Models\Kpi;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiAlert extends Model
{
    use HasFactory;

    protected $table = 'kpi_alerts';

    protected $fillable = [
        'kpi_definition_id',
        'alert_date',
        'alert_level',
        'message',
        'context_data',
        'is_acknowledged',
        'acknowledged_by',
        'acknowledged_at',
    ];

    protected $casts = [
        'alert_date' => 'date',
        'context_data' => 'array',
        'is_acknowledged' => 'boolean',
        'acknowledged_at' => 'datetime',
    ];

    public function definition(): BelongsTo
    {
        return $this->belongsTo(KpiDefinition::class, 'kpi_definition_id');
    }

    public function acknowledger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }
}
