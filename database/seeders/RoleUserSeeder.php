<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Roles
        $roles = [
            'Customer Service',
            'Designer',
            'Owner',
            'Finance',
            'PPIC',
            'Produksi',
            'Customer'
        ];

        foreach ($roles as $roleName) {
            Role::create(['name' => $roleName]);
        }

        // 2. Buat Default User untuk Testing
        $owner = User::create([
            'name' => 'Owner Victory',
            'email' => 'owner@victorylabs.id',
            'password' => bcrypt('Pa$$w0rd!'),
        ]);
        $owner->assignRole('Owner');

        $admin = User::create([
            'name' => 'Admin Victory',
            'email' => 'admin@victorylabs.id',
            'password' => bcrypt('Pa$$w0rd!'),
        ]);
        $admin->assignRole('Owner');

        $cs = User::create([
            'name' => 'CS User',
            'email' => 'cs@victorylabs.id',
            'password' => bcrypt('Pa$$w0rd!'),
        ]);
        $cs->assignRole('Customer Service');

        $designer = User::create([
            'name' => 'Designer User',
            'email' => 'designer@victorylabs.id',
            'password' => bcrypt('Pa$$w0rd!'),
        ]);
        $designer->assignRole('Designer');

        $finance = User::create([
            'name' => 'Finance User',
            'email' => 'finance@victorylabs.id',
            'password' => bcrypt('Pa$$w0rd!'),
        ]);
        $finance->assignRole('Finance');

        $ppic = User::create([
            'name' => 'PPIC User',
            'email' => 'ppic@victorylabs.id',
            'password' => bcrypt('Pa$$w0rd!'),
        ]);
        $ppic->assignRole('PPIC');

        $produksi = User::create([
            'name' => 'Produksi User',
            'email' => 'produksi@victorylabs.id',
            'password' => bcrypt('Pa$$w0rd!'),
        ]);
        $produksi->assignRole('Produksi');

        $customer = User::create([
            'name' => 'Customer User',
            'email' => 'customer@victorylabs.id',
            'password' => bcrypt('Pa$$w0rd!'),
        ]);
        $customer->assignRole('Customer');
    }
}