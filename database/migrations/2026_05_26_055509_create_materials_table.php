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
            $table->string('default_color')->nullable();

            $table->foreignId('default_vendor_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->integer('default_harga_ecer')->nullable();
            $table->integer('default_harga_roll')->nullable();
            $table->decimal('default_usage', 15, 4)->default(0);
            $table->enum('default_price_type', ['ecer', 'roll'])->default('ecer');

            $table->text('description')->nullable();
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
