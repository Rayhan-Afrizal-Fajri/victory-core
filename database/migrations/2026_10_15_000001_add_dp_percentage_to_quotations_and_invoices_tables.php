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
        if (Schema::hasTable('quotations') && !Schema::hasColumn('quotations', 'dp_percentage')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->decimal('dp_percentage', 5, 2)->default(50.00)->after('grand_total');
            });
        }

        if (Schema::hasTable('invoices') && !Schema::hasColumn('invoices', 'dp_percentage')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->decimal('dp_percentage', 5, 2)->default(50.00)->after('total_tagihan');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('quotations') && Schema::hasColumn('quotations', 'dp_percentage')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->dropColumn('dp_percentage');
            });
        }

        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'dp_percentage')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('dp_percentage');
            });
        }
    }
};
