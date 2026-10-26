<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. KPI Definitions
        Schema::create('kpi_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->enum('category', ['production', 'quality', 'financial', 'commercial', 'purchasing', 'worker']);
            $table->string('unit', 20); // %, hari, pcs, IDR
            $table->string('calculation_method', 100);
            $table->decimal('target_value', 12, 2);
            $table->decimal('warning_threshold', 12, 2)->nullable();
            $table->decimal('danger_threshold', 12, 2)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. KPI Metric Snapshots
        Schema::create('kpi_metric_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kpi_definition_id')->constrained('kpi_definitions')->cascadeOnDelete();
            $table->enum('period_type', ['daily', 'weekly', 'monthly', 'yearly']);
            $table->date('period_date');
            $table->decimal('actual_value', 15, 2);
            $table->decimal('target_value', 15, 2);
            $table->decimal('variance', 15, 2)->default(0);
            $table->enum('status', ['success', 'warning', 'danger']);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['kpi_definition_id', 'period_type', 'period_date'], 'unique_kpi_period_snap');
        });

        // 3. KPI Targets
        Schema::create('kpi_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kpi_definition_id')->constrained('kpi_definitions')->cascadeOnDelete();
            $table->enum('period_type', ['monthly', 'quarterly', 'yearly']);
            $table->integer('year');
            $table->integer('period_number');
            $table->decimal('target_value', 12, 2);
            $table->foreignId('set_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 4. KPI Alerts
        Schema::create('kpi_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kpi_definition_id')->constrained('kpi_definitions')->cascadeOnDelete();
            $table->date('alert_date');
            $table->enum('alert_level', ['warning', 'critical']);
            $table->text('message');
            $table->json('context_data')->nullable();
            $table->boolean('is_acknowledged')->default(false);
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_alerts');
        Schema::dropIfExists('kpi_targets');
        Schema::dropIfExists('kpi_metric_snapshots');
        Schema::dropIfExists('kpi_definitions');
    }
};
