<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Bersihkan data NULL atau string kosong yang sudah ada pada pesanan_material_specs
        if (Schema::hasTable('pesanan_material_specs')) {
            DB::table('pesanan_material_specs')
                ->whereNull('unit')
                ->orWhere('unit', '')
                ->update(['unit' => 'pcs']);
        }

        // 2. Bersihkan data NULL atau string kosong pada materials
        if (Schema::hasTable('materials')) {
            DB::table('materials')
                ->whereNull('unit')
                ->orWhere('unit', '')
                ->update(['unit' => 'pcs']);
        }

        // 3. Bersihkan data NULL atau string kosong pada product_materials
        if (Schema::hasTable('product_materials')) {
            DB::table('product_materials')
                ->whereNull('default_unit')
                ->orWhere('default_unit', '')
                ->update(['default_unit' => 'pcs']);
        }

        // 4. Bersihkan data NULL atau string kosong pada purchasings
        if (Schema::hasTable('purchasings')) {
            DB::table('purchasings')
                ->whereNull('satuan')
                ->orWhere('satuan', '')
                ->update(['satuan' => 'pcs']);

            Schema::table('purchasings', function (Blueprint $table) {
                $table->string('satuan')->default('pcs')->change();
            });
        }

        if (Schema::hasTable('pesanan_material_specs')) {
            Schema::table('pesanan_material_specs', function (Blueprint $table) {
                $table->string('unit')->default('pcs')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('purchasings')) {
            Schema::table('purchasings', function (Blueprint $table) {
                $table->string('satuan')->nullable(false)->change();
            });
        }
    }
};
