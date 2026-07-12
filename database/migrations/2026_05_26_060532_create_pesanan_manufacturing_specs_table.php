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
        Schema::create('pesanan_manufacturing_specs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pesanan_id')->constrained('pesanan')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('manufacturing_work_id')->nullable()->constrained('manufacturing_works')->nullOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('suppliers')->nullOnDelete();

            $table->string('work_name_snapshot');

            $table->decimal('usage', 15, 4)->default(1);
            $table->string('unit')->nullable();
            $table->string('usage_note')->nullable();

            $table->decimal('min_estimate', 15, 2)->default(0);
            $table->decimal('max_estimate', 15, 2)->default(0);

            $table->integer('sort_order')->default(0);
            $table->decimal('cost_per_pcs', 15, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pesanan_manufacturing_specs');
    }
};
