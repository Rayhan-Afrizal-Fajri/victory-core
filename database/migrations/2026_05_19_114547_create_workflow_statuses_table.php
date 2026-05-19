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
        Schema::create('workflow_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan')->onDelete('cascade');

            $table->boolean('design_uploaded')->default(false);
            $table->boolean('design_approved')->default(false);

            $table->boolean('sample_created')->default(false);
            $table->boolean('sample_paid')->default(false);
            $table->boolean('sample_delivered')->default(false);
            $table->boolean('sample_approved')->default(false);

            $table->boolean('production_invoice_created')->default(false);
            $table->boolean('production_dp_paid')->default(false);
            
            $table->boolean('materials_purchased')->default(false);
            $table->boolean('materials_received')->default(false);
            $table->boolean('materials_distributed')->default(false);
            
            $table->boolean('production_started')->default(false);
            $table->boolean('production_completed')->default(false);
            
            $table->boolean('qc_completed')->default(false);
            $table->boolean('packing_completed')->default(false);
            
            $table->boolean('final_payment_paid')->default(false);
            
            $table->boolean('delivered')->default(false);
            $table->boolean('completed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_statuses');
    }
};
