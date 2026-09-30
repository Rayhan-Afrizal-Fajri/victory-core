<?php

namespace Tests\Unit;

use App\Support\DocumentFilename;
use PHPUnit\Framework\TestCase;

class DocumentFilenameTest extends TestCase
{
    public function test_it_includes_the_document_number_company_all_articles_and_document_type(): void
    {
        $filename = DocumentFilename::make(
            'INV/001',
            'Victory Labs',
            ['T-Shirt Oversize Hitam', 'Hoodie Abu-Abu'],
            'DP Produksi'
        );

        $this->assertSame(
            'INV-001 - Victory Labs - T-Shirt Oversize Hitam, Hoodie Abu-Abu - DP Produksi.pdf',
            $filename
        );
    }

    public function test_it_uses_fallbacks_and_removes_unsafe_filename_characters(): void
    {
        $filename = DocumentFilename::make('INV:001', null, ['Kaos/Hitam'], 'Pelunasan Produksi');

        $this->assertSame(
            'INV-001 - Customer - Kaos-Hitam - Pelunasan Produksi.pdf',
            $filename
        );
    }
}