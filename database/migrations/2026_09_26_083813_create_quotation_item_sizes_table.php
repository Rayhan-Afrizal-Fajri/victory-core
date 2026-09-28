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
        Schema::create('quotation_item_sizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_item_id')->constrained()->cascadeOnDelete();
            $table->string('size_label');
            $table->integer('qty');
            $table->decimal('price_per_pcs', 15, 2)->default(0);
            $table->decimal('sub_total', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_item_sizes');
    }
};
