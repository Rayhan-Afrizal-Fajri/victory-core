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
        Schema::table('samples', function (Blueprint $table) {
            $table->unsignedInteger('revision_number')->default(0);
            $table->foreignId('parent_sample_id')->nullable()->constrained('samples')->nullOnDelete();
            $table->boolean('is_chargeable')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->dropColumn([
                'revision_number',
                'parent_sample_id',
                'is_chargeable',
                'created_by'
            ]);
        });
    }
};
