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
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (!Schema::hasColumn('invoices', 'customer_po_number')) {
                    $table->string('customer_po_number', 100)->nullable()->after('status_tagihan');
                }
                if (!Schema::hasColumn('invoices', 'notes')) {
                    $table->text('notes')->nullable()->after('customer_po_number');
                }
            });
        }

        if (Schema::hasTable('job_tickets')) {
            Schema::table('job_tickets', function (Blueprint $table) {
                if (!Schema::hasColumn('job_tickets', 'customer_po_number')) {
                    $table->string('customer_po_number', 100)->nullable()->after('customer_notes');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (Schema::hasColumn('invoices', 'customer_po_number')) {
                    $table->dropColumn('customer_po_number');
                }
                if (Schema::hasColumn('invoices', 'notes')) {
                    $table->dropColumn('notes');
                }
            });
        }

        if (Schema::hasTable('job_tickets')) {
            Schema::table('job_tickets', function (Blueprint $table) {
                if (Schema::hasColumn('job_tickets', 'customer_po_number')) {
                    $table->dropColumn('customer_po_number');
                }
            });
        }
    }
};

