<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CustomerSeeder extends Seeder
{

    private function randomAddress(): array
    {
        $provinces = Http::get(
            'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json'
        )->json();

        $province = collect($provinces)->random();

        $cities = Http::get(
            "https://www.emsifa.com/api-wilayah-indonesia/api/regencies/{$province['id']}.json"
        )->json();

        $city = collect($cities)->random();

        $districts = Http::get(
            "https://www.emsifa.com/api-wilayah-indonesia/api/districts/{$city['id']}.json"
        )->json();

        $district = collect($districts)->random();

        $villages = Http::get(
            "https://www.emsifa.com/api-wilayah-indonesia/api/villages/{$district['id']}.json"
        )->json();

        $villages = collect($villages);

        $village = $villages->isNotEmpty()
            ? $villages->random()
            : ['name' => '-'];

        return [
            'provinsi' => Str::title(Str::lower($province['name'])),
            'kota' => Str::title(Str::lower($city['name'])),
            'kecamatan' => Str::title(Str::lower($district['name'])),
            'kelurahan' => Str::title(Str::lower($village['name'])),
        ];
    }
    public function run(): void
    {
        $customers = [
            [
                'nama' => 'Budi Santoso',
                'jabatan' => 'Admin',
                'no_hp' => '081234567890',
                'nama_perusahaan' => 'Budi Konveksi',
            ],
            [
                'nama' => 'Siti Aminah',
                'jabatan' => 'Admin',
                'no_hp' => '081298765432',
                'nama_perusahaan' => 'Siti Fashion',
            ],
            [
                'nama' => 'Andi Pratama',
                'jabatan' => 'Admin',
                'no_hp' => '082112223333',
                'nama_perusahaan' => 'Andi Apparel',
            ],
            [
                'nama' => 'Dewi Lestari',
                'jabatan' => 'Admin',
                'no_hp' => '083144445555',
                'nama_perusahaan' => 'Dewi Collection',
            ],
        ];

        foreach ($customers as $customer) {

            $alamat = $this->randomAddress();

            Customer::create([
                'nama' => $customer['nama'],
                'jabatan' => $customer['jabatan'],
                'nama_perusahaan' => $customer['nama_perusahaan'],
                'no_hp' => $customer['no_hp'],

                ...$alamat,

                'kode_pos' => fake()->postcode(),
                'alamat_detail' => fake()->streetAddress(),
            ]);
        }

        Customer::create([
            'name'=> 'Ibu Dyah',
            'jabatan' => 'Vice President',
            'nama_perusahaan' => 'PT. Royal Medika Pharmalab',
            'no_hp' => '08119599489',
            'provinsi' => 'DKI JAKARTA',
            'kota' => 'KOTA JAKARTA BARAT',
            'kecamatan' => 'KEBON JERUK',
            'kelurahan' => 'KEBON JERUK',
            'kode_pos' => '11530',
            'alamat_detail' => 'Jl. Perjuangan No. 1, Kedoya Center Blok E1'
        ]);
    }
}