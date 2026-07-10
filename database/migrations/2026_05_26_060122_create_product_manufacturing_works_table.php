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
        Schema::create('product_manufacturing_works', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('manufacturing_work_id')->constrained()->restrictOnDelete();

            $table->decimal('default_usage', 15, 4)->default(1);
            $table->string('default_unit')->nullable();
            $table->string('usage_note')->nullable();
            $table->integer('min_estimate')->nullable();
            $table->integer('max_estimate')->nullable();

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
        Schema::dropIfExists('product_manufacturing_works');
    }
};
