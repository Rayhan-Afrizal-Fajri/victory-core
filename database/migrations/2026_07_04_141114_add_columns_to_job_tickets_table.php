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
        Schema::table('job_tickets', function (Blueprint $table) {
            $table->string('sales_name')->nullable()->after('company_profile_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_tickets', function (Blueprint $table) {
            $table->dropColumn([
                'sales_name'
            ]);
        });
    }
};
