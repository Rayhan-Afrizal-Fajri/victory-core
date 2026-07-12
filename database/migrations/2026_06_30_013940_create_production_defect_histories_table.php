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
        Schema::create('production_defect_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_ticket_id')->constrained('job_tickets')->cascadeOnDelete();
            $table->foreignId('pesanan_id')->constrained('pesanan')->cascadeOnDelete();
            $table->foreignId('production_run_process_id')->constrained('production_run_processes')->cascadeOnDelete();
            
            $table->integer('defect_qty');
            $table->text('defect_reason'); // Penjelasan cacatnya apa
            $table->string('corrective_action'); // rework, throw_away, repurchase_material
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_defect_histories');
    }
};
