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
        Schema::table('workflow_statuses', function (Blueprint $table) {
            $table->boolean('sample_started')->default(0)->after('sample_created');
            $table->boolean('sample_uploaded')->default(0)->after('sample_started');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_statuses', function (Blueprint $table) {
            $table->dropColumn([
                'sample_started',
                'sample_uploaded'
            ]);
        });
    }
};
