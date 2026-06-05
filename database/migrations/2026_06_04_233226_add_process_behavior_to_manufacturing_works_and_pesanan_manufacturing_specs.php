<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('manufacturing_works', function (Blueprint $table) {
            $table->string('process_behavior')
                ->default('production_process')
                ->after('default_unit');
        });

        Schema::table('pesanan_manufacturing_specs', function (Blueprint $table) {
            $table->string('process_behavior')
                ->default('production_process')
                ->after('usage_note');
        });
    }

    public function down(): void
    {
        Schema::table('manufacturing_works', function (Blueprint $table) {
            $table->dropColumn('process_behavior');
        });

        Schema::table('pesanan_manufacturing_specs', function (Blueprint $table) {
            $table->dropColumn('process_behavior');
        });
    }
};
