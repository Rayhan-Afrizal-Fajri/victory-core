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
        Schema::table('materials', function (Blueprint $table) {
            $table->integer('default_harga_ecer')->nullable()->after('default_color');
            $table->integer('default_harga_roll')->nullable()->after('default_harga_ecer');
            $table->decimal('default_usage', 15, 4)->default(0)->after('default_harga_roll');
            $table->enum('default_price_type', ['ecer', 'roll'])->default('ecer')->after('default_usage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn(['default_harga_ecer', 'default_harga_roll', 'default_usage', 'default_price_type']);
        });
    }
};
