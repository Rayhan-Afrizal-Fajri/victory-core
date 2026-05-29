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
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('category', ['bahan', 'aksesoris']);
            $table->string('unit')->nullable();

            $table->foreignId('default_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();

            $table->decimal('harga_ecer', 15, 2)->default(0);
            $table->decimal('harga_roll', 15, 2)->default(0);
            $table->decimal('roll_qty', 15, 2)->nullable();
            $table->string('roll_unit')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
