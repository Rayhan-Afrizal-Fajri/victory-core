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
        Schema::create('product_materials', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('material_id')->constrained()->restrictOnDelete();

            $table->foreignId('default_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();

            $table->decimal('harga_ecer', 15, 2)->default(0);
            $table->decimal('harga_roll', 15, 2)->default(0);

            $table->enum('type', ['bahan', 'aksesoris']);
            $table->decimal('default_usage', 15, 4)->default(0);
            $table->string('default_unit')->nullable();
            $table->string('default_color')->nullable();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_materials');
    }
};
