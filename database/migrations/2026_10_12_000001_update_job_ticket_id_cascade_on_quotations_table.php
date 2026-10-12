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
        if ($this->hasForeignIndex('quotations', 'quotations_job_ticket_id_foreign')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->dropForeign(['job_ticket_id']);
            });
        }

        Schema::table('quotations', function (Blueprint $table) {
            $table->foreign('job_ticket_id')
                ->references('id')
                ->on('job_tickets')
                ->cascadeOnDelete();
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
            $table->foreign('job_ticket_id')
                ->references('id')
                ->on('job_tickets')
                ->nullOnDelete();
        });
    }

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
