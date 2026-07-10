<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\DefaultSizeBreakdown;

class DefaultSizeBreakdownSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DefaultSizeBreakdown::create([
            'type' => 'color',
            'label' => 'Hitam',
            'sequence' => 1
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'color',
            'label' => 'Merah',
            'sequence' => 2
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'color',
            'label' => 'Putih',
            'sequence' => 3
        ]);

        DefaultSizeBreakdown::create([
            'type' => 'fabric',
            'label' => '16s',
            'sequence' => 1
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'fabric',
            'label' => '24s',
            'sequence' => 2
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'fabric',
            'label' => '30s',
            'sequence' => 3
        ]);

        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'XS',
            'sequence' => 1
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'S',
            'sequence' => 2
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'M',
            'sequence' => 3
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'L',
            'sequence' => 4
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'XL',
            'sequence' => 5
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'XXL',
            'sequence' => 6
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'XXXL',
            'sequence' => 7
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'All Size',
            'sequence' => 8,
        ]);

        DefaultSizeBreakdown::create([
            'type' => 'unit',
            'label' => 'meter',
            'sequence' => 1
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'unit',
            'label' => 'pcs',
            'sequence' => 2
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'unit',
            'label' => 'kg',
            'sequence' => 3
        ]);
    }
}
