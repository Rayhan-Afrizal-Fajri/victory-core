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
        Schema::create('pesanan_material_specs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pesanan_id')->constrained('pesanan')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('material_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();

            $table->enum('type', ['bahan', 'aksesoris']);

            $table->string('material_name_snapshot');
            $table->string('color')->nullable();

            $table->decimal('usage', 15, 4)->default(0); // pemakaian
            $table->string('unit')->nullable();

            $table->decimal('usage_per_set', 15, 4)->default(1); // penggunaan berapa pcs/set

            $table->decimal('harga_ecer', 15, 2)->default(0);
            $table->decimal('harga_roll', 15, 2)->default(0);

            $table->enum('price_type', ['ecer', 'roll'])->default('ecer');

            $table->decimal('roll_qty', 15, 4)->nullable();

            $table->decimal('total_usage', 15, 4)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->decimal('cost_per_pcs', 15, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pesanan_material_specs');
    }
};
