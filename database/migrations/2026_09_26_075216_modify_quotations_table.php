<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop the foreign key only if it actually exists in MySQL
        if ($this->hasForeignIndex('quotations', 'quotations_job_ticket_id_foreign')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->dropForeign(['job_ticket_id']);
            });
        }

        // 2. Safely modify the column type and add the new foreign key constraint
        Schema::table('quotations', function (Blueprint $table) {
            $table->unsignedBigInteger('job_ticket_id')->nullable()->change();
            
            $table->foreign('job_ticket_id')
                ->references('id')
                ->on('job_tickets')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ($this->hasForeignIndex('quotations', 'quotations_job_ticket_id_foreign')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->dropForeign(['job_ticket_id']);
            });
        }

        Schema::table('quotations', function (Blueprint $table) {
            $table->unsignedBigInteger('job_ticket_id')->nullable(false)->change();
            
            $table->foreign('job_ticket_id')
                ->references('id')
                ->on('job_tickets')
                ->cascadeOnDelete();
        });
    }

    /**
     * A pure MySQL raw query check to see if the foreign key exists.
     * This avoids using Doctrine entirely.
     */
    private function hasForeignIndex(string $table, string $constraintName): bool
    {
        $result = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = ? 
              AND CONSTRAINT_NAME = ?
        ", [$table, $constraintName]);

        return !empty($result);
    }
};