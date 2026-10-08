<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            ['T-Shirt Polos', 'T-Shirt', 'Kaos Polos Hitam XL', '1', '1'],
            ['Tote Bag Kanvas', 'Tote Bag', 'Tote Bag bahan Kanvas Putih', '1', '0']
        ];
    }

    public function headings(): array
    {
        return [
            'Name',
            'Category Name',
            'Description',
            'Is Active',
            'Is Pattern Available'
        ];
    }
}
