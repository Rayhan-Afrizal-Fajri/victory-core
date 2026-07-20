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
                // 'nama' => 'Karuniatex',
                'nama_perusahaan' => 'Karuniatex',
                // 'email' => 'agus@kainmakmur.com',
                'kategori' => 'Bahan Baku',
                // 'kontak' => '081111112222',
                // 'alamat' => 'Jl. Tekstil No. 1, Bandung',
            ],
            [
                // 'nama' => 'Karuniatex',
                'nama_perusahaan' => 'Fokus',
                // 'email' => 'agus@kainmakmur.com',
                'kategori' => 'Bahan Baku',
                // 'kontak' => '081111112222',
                // 'alamat' => 'Jl. Tekstil No. 1, Bandung',
            ],
            [
                // 'nama' => 'Karuniatex',
                'nama_perusahaan' => 'Intan',
                // 'email' => 'agus@kainmakmur.com',
                'kategori' => 'Bahan Baku',
                // 'kontak' => '081111112222',
                // 'alamat' => 'Jl. Tekstil No. 1, Bandung',
            ],
            [
                // 'nama' => 'Karuniatex',
                'nama_perusahaan' => 'CKP',
                // 'email' => 'agus@kainmakmur.com',
                'kategori' => 'Bahan Baku',
                // 'kontak' => '081111112222',
                // 'alamat' => 'Jl. Tekstil No. 1, Bandung',
            ],
            [
                // 'nama' => 'Karuniatex',
                'nama_perusahaan' => 'Knitto',
                // 'email' => 'agus@kainmakmur.com',
                'kategori' => 'Bahan Baku',
                // 'kontak' => '081111112222',
                // 'alamat' => 'Jl. Tekstil No. 1, Bandung',
            ],
            [
                // 'nama' => 'Karuniatex',
                'nama_perusahaan' => 'Fabriku',
                // 'email' => 'agus@kainmakmur.com',
                'kategori' => 'Bahan Baku',
                // 'kontak' => '081111112222',
                // 'alamat' => 'Jl. Tekstil No. 1, Bandung',
            ],

            [
                // 'nama' => 'Fabriku',
                'nama_perusahaan' => 'Max Print',
                // 'email' => 'rina@aksesorisjaya.com',
                'kategori' => 'Aksesoris',
                // 'kontak' => '082222223333',
                // 'alamat' => 'Jl. Kancing No. 5, Jakarta',
            ],
            [
                'nama' => 'Toko 1001',
                'nama_perusahaan' => 'Toko 1001',
                // 'email' => 'rina@aksesorisjaya.com',
                'kategori' => 'Aksesoris',
                // 'kontak' => '082222223333',
                // 'alamat' => 'Jl. Kancing No. 5, Jakarta',
            ],
            [
                // 'nama' => 'Fabriku',
                'nama_perusahaan' => 'Mapan Plastik',
                // 'email' => 'rina@aksesorisjaya.com',
                'kategori' => 'Aksesoris',
                // 'kontak' => '082222223333',
                // 'alamat' => 'Jl. Kancing No. 5, Jakarta',
            ],
            [
                // 'nama' => 'Fabriku',
                'nama_perusahaan' => 'Lucas',
                // 'email' => 'rina@aksesorisjaya.com',
                'kategori' => 'Aksesoris',
                // 'kontak' => '082222223333',
                // 'alamat' => 'Jl. Kancing No. 5, Jakarta',
            ],

            [
                'nama' => 'CKP',
                'nama_perusahaan' => 'Hendra Makloon',
                'email' => 'hendra@makloon.com',
                'kategori' => 'CMT / Makloon',
                'kontak' => '083333334444',
                'alamat' => 'Jl. Produksi No. 12, Cimahi',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}