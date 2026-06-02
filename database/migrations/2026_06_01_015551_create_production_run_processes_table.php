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
        Schema::create('production_run_processes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('production_run_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('pesanan_manufacturing_spec_id')
                ->nullable()
                ->constrained('pesanan_manufacturing_specs')
                ->nullOnDelete();

            $table->string('work_name');
            $table->integer('sequence')->default(0);

            $table->enum('status', [
                'pending',
                'in_progress',
                'completed',
            ])->default('pending');

            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->integer('checked_qty')->default(0);
            $table->integer('passed_qty')->default(0);
            $table->integer('defect_qty')->default(0);

            $table->enum('qc_status', [
                'pending',
                'passed',
                'failed',
            ])->default('pending');

            $table->text('qc_notes')->nullable();
            $table->string('corrective_action')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_run_processes');
    }
};
