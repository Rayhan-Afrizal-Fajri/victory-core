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
        Schema::create('manufacturing_works', function (Blueprint $table) {
            $table->id();
            // $table->foreignId('role_id')->constrained('roles')->restrictOnDelete();
            $table->string('name'); // cutting, jahit, qc, sablon
            $table->string('default_unit')->nullable();
            $table->string('process_behavior')->default('production_process');

            $table->foreignId('default_vendor_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->decimal('default_min_estimate', 15, 2)->default(0);
            $table->decimal('default_max_estimate', 15, 2)->default(0);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manufacturing_works');
    }
};
