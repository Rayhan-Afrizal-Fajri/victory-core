<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'user' => [
                    'name' => 'Budi Santoso',
                    'email' => 'budi.customer@example.com',
                    'password' => bcrypt('password!'),
                ],
                'customer' => [
                    'nama' => 'Budi Santoso',
                    'no_hp' => '081234567890',
                    'nama_perusahaan' => 'Budi Konveksi',
                    'alamat' => 'Jl. Melati No. 10, Bandung',
                ],
            ],
            [
                'user' => [
                    'name' => 'Siti Aminah',
                    'email' => 'siti.customer@example.com',
                    'password' => bcrypt('password!'),
                ],
                'customer' => [
                    'nama' => 'Siti Aminah',
                    'no_hp' => '081298765432',
                    'nama_perusahaan' => 'Siti Fashion',
                    'alamat' => 'Jl. Mawar No. 21, Jakarta',
                ],
            ],
            [
                'user' => [
                    'name' => 'Andi Pratama',
                    'email' => 'andi.customer@example.com',
                    'password' => bcrypt('password!'),
                ],
                'customer' => [
                    'nama' => 'Andi Pratama',
                    'no_hp' => '082112223333',
                    'nama_perusahaan' => 'Andi Apparel',
                    'alamat' => 'Jl. Kenanga No. 7, Surabaya',
                ],
            ],
            [
                'user' => [
                    'name' => 'Dewi Lestari',
                    'email' => 'dewi.customer@example.com',
                    'password' => bcrypt('password!'),
                ],
                'customer' => [
                    'nama' => 'Dewi Lestari',
                    'no_hp' => '083144445555',
                    'nama_perusahaan' => 'Dewi Collection',
                    'alamat' => 'Jl. Anggrek No. 15, Yogyakarta',
                ],
            ],
        ];

        foreach ($customers as $data) {
            $user = User::create($data['user']);

            $user->assignRole('Customer');

            Customer::create([
                'nama' => $data['customer']['nama'],
                'user_id' => $user->id,
                'no_hp' => $data['customer']['no_hp'],
                'nama_perusahaan' => $data['customer']['nama_perusahaan'],
                'alamat' => $data['customer']['alamat'],
            ]);
        }
    }
}