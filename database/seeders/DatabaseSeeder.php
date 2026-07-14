<?php

namespace Database\Seeders;

// use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleUserSeeder::class,
            CustomerSeeder::class,
            SupplierSeeder::class,
            MaterialSeeder::class,
            ManufacturingWorkSeeder::class,
            ProductSeeder::class,
            CompanyProfileSeeder::class,
            DefaultSizeBreakdownSeeder::class,
            // PesananSeeder::class,
        ]);
    }
}
