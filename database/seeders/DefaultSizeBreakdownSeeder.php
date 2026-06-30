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
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'color',
            'label' => 'Merah',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'color',
            'label' => 'Putih',
        ]);

        DefaultSizeBreakdown::create([
            'type' => 'fabric',
            'label' => '10s',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'fabric',
            'label' => '16s',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'fabric',
            'label' => '24s',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'fabric',
            'label' => '30s',
        ]);

        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'XS',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'S',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'M',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'L',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'XL',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'XXL',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'XXXL',
        ]);
        DefaultSizeBreakdown::create([
            'type' => 'size',
            'label' => 'All Size',
        ]);
    }
}
