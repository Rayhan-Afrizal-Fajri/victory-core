<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->after('job_ticket_id')->constrained('customers')->nullOnDelete();
            $table->foreignId('company_profile_id')->nullable()->after('customer_id')->constrained('company_profiles')->nullOnDelete();
            $table->string('customer_name_snapshot')->nullable()->after('company_profile_id');
            $table->string('customer_company_snapshot')->nullable()->after('customer_name_snapshot');
            $table->string('customer_phone_snapshot')->nullable()->after('customer_company_snapshot');
            $table->text('customer_address_snapshot')->nullable()->after('customer_phone_snapshot');
        });

        Schema::table('quotation_items', function (Blueprint $table) {
            $table->dropForeign(['pesanan_id']);
            $table->unsignedBigInteger('pesanan_id')->nullable()->change();
            $table->foreign('pesanan_id')->references('id')->on('pesanan')->nullOnDelete();
            $table->unsignedInteger('sample_quantity')->default(0)->after('quantity');
            $table->decimal('sample_price_per_pcs', 15, 2)->default(0)->after('sample_quantity');
        });
    }

    public function down(): void
    {
        if (DB::table('quotation_items')->whereNull('pesanan_id')->exists()) {
            throw new RuntimeException('Cannot roll back standalone quotation support while quotation items without a PO order exist.');
        }

        Schema::table('quotation_items', function (Blueprint $table) {
            $table->dropForeign(['pesanan_id']);
            $table->dropColumn(['sample_quantity', 'sample_price_per_pcs']);
            $table->unsignedBigInteger('pesanan_id')->nullable(false)->change();
            $table->foreign('pesanan_id')->references('id')->on('pesanan')->cascadeOnDelete();
        });

        Schema::table('quotations', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['company_profile_id']);
            $table->dropColumn([
                'customer_id',
                'company_profile_id',
                'customer_name_snapshot',
                'customer_company_snapshot',
                'customer_phone_snapshot',
                'customer_address_snapshot',
            ]);
        });
    }
};