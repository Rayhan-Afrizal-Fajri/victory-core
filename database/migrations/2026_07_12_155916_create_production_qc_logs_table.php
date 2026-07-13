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
        Schema::create('production_qc_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_run_process_id')->constrained('production_run_processes')->cascadeOnDelete();
            $table->integer('checked_qty')->default(0);
            $table->integer('passed_qty')->default(0);
            $table->integer('defect_qty')->default(0);
            $table->string('defect_reason')->nullable();
            $table->string('corrective_action')->nullable();
            $table->enum('qc_type', ['initial_check', 'rework_check'])->default('initial_check');
            $table->foreignId('checked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_qc_logs');
    }
};
