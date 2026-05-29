<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'nama' => 'Agus Setiawan',
                'nama_perusahaan' => 'PT Kain Makmur',
                'email' => 'agus@kainmakmur.com',
                'kategori' => 'Bahan Baku',
                'kontak' => '081111112222',
                'alamat' => 'Jl. Tekstil No. 1, Bandung',
            ],
            [
                'nama' => 'Rina Wijaya',
                'nama_perusahaan' => 'CV Aksesoris Jaya',
                'email' => 'rina@aksesorisjaya.com',
                'kategori' => 'Aksesoris',
                'kontak' => '082222223333',
                'alamat' => 'Jl. Kancing No. 5, Jakarta',
            ],
            [
                'nama' => 'Hendra Saputra',
                'nama_perusahaan' => 'Hendra Makloon',
                'email' => 'hendra@makloon.com',
                'kategori' => 'CMT / Makloon',
                'kontak' => '083333334444',
                'alamat' => 'Jl. Produksi No. 12, Cimahi',
            ],
            [
                'nama' => 'Maya Putri',
                'nama_perusahaan' => 'PT Benang Nusantara',
                'email' => 'maya@benangnusantara.com',
                'kategori' => 'Bahan Baku',
                'kontak' => '084444445555',
                'alamat' => 'Jl. Industri No. 8, Tangerang',
            ],
            [
                'nama' => 'Doni Prakoso',
                'nama_perusahaan' => 'CV Labelindo',
                'email' => 'doni@labelindo.com',
                'kategori' => 'Aksesoris',
                'kontak' => '085555556666',
                'alamat' => 'Jl. Label No. 3, Bekasi',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}