<?php

namespace Database\Seeders;

use App\Models\ManufacturingWork;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ManufacturingWorkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ManufacturingWork::create([
            'name' => 'Cutting',
            'default_unit' => 'pcs',
            'default_max_estimate' => 1000,
            'is_active' => true,
            'process_behavior' => 'production_process',
        ]);

        ManufacturingWork::create([
            'name' => 'Sablon',
            'default_unit' => 'pcs',
            'default_max_estimate' => 1600,
            'is_active' => true,
            'process_behavior' => 'production_process',
        ]);

        ManufacturingWork::create([
            'name' => 'Jahit',
            'default_unit' => 'pcs',
            'default_max_estimate' => 1400,
            'is_active' => true,
            'process_behavior' => 'production_process',
        ]);

        ManufacturingWork::create([
            'name' => 'Pasang Kancing',
            'default_unit' => 'pcs',
            'default_max_estimate' => 1400,
            'is_active' => true,
            'process_behavior' => 'production_process',
        ]);

        ManufacturingWork::create([
            'name' => 'Bordir',
            'default_unit' => 'pcs',
            'default_max_estimate' => 200,
            'is_active' => true,
            'process_behavior' => 'production_process',
        ]);

        ManufacturingWork::create([
            'name' => 'Finishing',
            'default_unit' => 'pcs',
            'default_max_estimate' => 800,
            'is_active' => true,
            'process_behavior' => 'production_process',
        ]);

        ManufacturingWork::create([
            'name' => 'QC',
            'default_unit' => 'pcs',
            'default_max_estimate' => 500,
            'is_active' => true,
            'process_behavior' => 'costing_only',
        ]);

        ManufacturingWork::create([
            'name' => 'Packing',
            'default_unit' => 'pcs',
            'default_max_estimate' => 400,
            'is_active' => true,
            'process_behavior' => 'costing_only',
        ]);
    }
}
