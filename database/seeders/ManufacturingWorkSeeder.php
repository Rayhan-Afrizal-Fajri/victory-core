<?php

namespace Database\Seeders;

use App\Models\ManufacturingWork;
use Illuminate\Database\Seeder;

class ManufacturingWorkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $works = [
            ['name' => 'Setting', 'default_unit' => 'pcs', 'default_max_estimate' => 1000, 'is_active' => true, 'process_behavior' => 'production_process'],
            // ['name' => 'Cutting', 'default_unit' => 'pcs', 'default_max_estimate' => 1200, 'is_active' => true, 'process_behavior' => 'production_process'],
            // ['name' => 'Sablon', 'default_unit' => 'pcs', 'default_max_estimate' => 3000, 'is_active' => true, 'process_behavior' => 'production_process'],
            ['name' => 'DTF', 'default_unit' => 'pcs', 'default_max_estimate' => 3000, 'is_active' => true, 'process_behavior' => 'production_process'],
            // ['name' => 'Jahit', 'default_unit' => 'pcs', 'default_max_estimate' => 2500, 'is_active' => true, 'process_behavior' => 'production_process'],
            // ['name' => 'Pasang Kancing', 'default_unit' => 'pcs', 'default_max_estimate' => 250, 'is_active' => true, 'process_behavior' => 'production_process'],
            // ['name' => 'Bordir', 'default_unit' => 'pcs', 'default_max_estimate' => 200, 'is_active' => true, 'process_behavior' => 'production_process'],
            // ['name' => 'QC', 'default_unit' => 'pcs', 'default_max_estimate' => 500, 'is_active' => true, 'process_behavior' => 'costing_only'],
            // ['name' => 'Finishing', 'default_unit' => 'pcs', 'default_max_estimate' => 500, 'is_active' => true, 'process_behavior' => 'production_process'],
            // ['name' => 'Packing', 'default_unit' => 'pcs', 'default_max_estimate' => 400, 'is_active' => true, 'process_behavior' => 'costing_only'],
        ];

        foreach ($works as $work) {
            ManufacturingWork::firstOrCreate(
                ['name' => $work['name']],
                $work
            );
        }
    }
}