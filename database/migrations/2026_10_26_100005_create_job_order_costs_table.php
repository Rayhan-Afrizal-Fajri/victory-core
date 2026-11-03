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
        Schema::create('job_order_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->unique()->constrained('pesanan')->cascadeOnDelete();
            $table->foreignId('job_ticket_id')->constrained('job_tickets')->cascadeOnDelete();
            $table->decimal('estimated_material_cost', 15, 2)->default(0);
            $table->decimal('actual_material_cost', 15, 2)->default(0);
            $table->decimal('estimated_labor_cost', 15, 2)->default(0);
            $table->decimal('actual_labor_cost', 15, 2)->default(0);
            $table->decimal('estimated_subcon_cost', 15, 2)->default(0);
            $table->decimal('actual_subcon_cost', 15, 2)->default(0);
            $table->decimal('defect_scrap_cost', 15, 2)->default(0);
            $table->decimal('total_estimated_cogs', 15, 2)->default(0);
            $table->decimal('total_actual_cogs', 15, 2)->default(0);
            $table->decimal('revenue_billed', 15, 2)->default(0);
            $table->decimal('gross_profit', 15, 2)->default(0);
            $table->decimal('gross_margin_pct', 8, 2)->default(0);
            $table->enum('status', ['in_progress', 'completed', 'settled'])->default('in_progress');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_order_costs');
    }
};
