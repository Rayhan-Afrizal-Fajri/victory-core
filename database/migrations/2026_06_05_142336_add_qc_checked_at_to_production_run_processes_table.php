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
        Schema::table('production_run_processes', function (Blueprint $table) {
            $table->timestamp('qc_checked_at')->nullable()->after('qc_status');
            $table->foreignId('qc_checked_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->after('qc_checked_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_run_processes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('qc_checked_by');
            $table->dropColumn('qc_checked_at');
        });
    }
};
