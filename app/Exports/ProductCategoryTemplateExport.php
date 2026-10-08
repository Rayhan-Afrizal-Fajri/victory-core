<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductCategoryTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            ['T-Shirt'],
            ['Tote Bag']
        ];
    }

    public function headings(): array
    {
        return [
            'Name',
        ];
    }
}
