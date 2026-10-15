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
        Schema::create('product_import_conflicts', function (Blueprint $table) {
            $table->id();
            $table->string('batch_id', 64)->index();
            $table->integer('sheet_index')->nullable();
            $table->string('sheet_title')->nullable();
            $table->string('product_name');
            $table->foreignId('existing_product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('separated_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('status', 32)->default('updated'); // 'updated', 'kept', 'separated'
            $table->json('matched_fields')->nullable();
            $table->json('previous_data')->nullable();
            $table->json('imported_data')->nullable();
            $table->json('changes_summary')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_import_conflicts');
    }
};
