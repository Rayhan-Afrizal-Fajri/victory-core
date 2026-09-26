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
        // 1. Only try to drop the foreign key if it actually exists in the DB
        if (Schema::hasTable('quotations') && $this->hasForeignIndex('quotations', 'quotations_job_ticket_id_foreign')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->dropForeign(['job_ticket_id']);
            });
        }

        // 2. Change the column and bind the new key
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
        if (Schema::hasTable('quotations') && $this->hasForeignIndex('quotations', 'quotations_job_ticket_id_foreign')) {
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
     * Helper method to check if a foreign key index exists.
     */
    private function hasForeignIndex(string $table, string $foreignKey): bool
    {
        $conn = Schema::getConnection()->getDoctrineSchemaManager();
        $keys = array_keys($conn->listTableForeignKeys($table));
        return in_array($foreignKey, $keys);
    }
};