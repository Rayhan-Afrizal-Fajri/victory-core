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
            $table->boolean('production_created')->default(false)->after('final_payment_paid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_statuses', function (Blueprint $table) {
            $table->dropColumn(['production_created']);
        });
    }
};
