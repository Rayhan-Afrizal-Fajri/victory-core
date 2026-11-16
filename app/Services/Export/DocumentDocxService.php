<?php

namespace App\Services\Export;

use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\SuratJalan;
use App\Models\User;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\SimpleType\JcTable;
use PhpOffice\PhpWord\Shared\Converter;

class DocumentDocxService
{
    /**
     * Create an Invoice docx document
     */
    public function generateInvoiceDocx(Invoice $invoice, ?string $documentType = null): string
    {
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(10);

        $section = $phpWord->addSection([
            'marginTop' => Converter::cmToTwip(1.5),
            'marginBottom' => Converter::cmToTwip(1.5),
            'marginLeft' => Converter::cmToTwip(1.8),
            'marginRight' => Converter::cmToTwip(1.8),
        ]);

        $jobTicket = $invoice->jobTicket;
        $approvedQuotation = $jobTicket?->quotations
            ->where('status', 'approved')
            ->sortByDesc('id')
            ->first();
        $companyProfile = $approvedQuotation?->companyProfile ?: $jobTicket?->companyProfile;
        $customer = $jobTicket?->customer;

        $dpPercentage = (float) ($invoice->dp_percentage ?? $approvedQuotation?->dp_percentage ?? 50.00);
        $dpLabelPct = round($dpPercentage, 2);
        $settlementLabelPct = round(100 - $dpPercentage, 2);

        $documentTitle = match ($documentType) {
            'dp' => "INVOICE - DP PRODUKSI ({$dpLabelPct}%)",
            'settlement' => "INVOICE - PELUNASAN PRODUKSI ({$settlementLabelPct}%)",
            'full' => "INVOICE PRODUKSI",
            default => "INVOICE",
        };

        // Header Table (Logo / Company left, Title & Meta right)
        $headerTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $headerTable->addRow();
        
        $leftCell = $headerTable->addCell(Converter::cmToTwip(9));
        $logoPath = public_path('images/logo.png');
        if (file_exists($logoPath)) {
            $leftCell->addImage($logoPath, ['width' => 140, 'height' => 38]);
        } else {
            $leftCell->addText($companyProfile?->company_name ?? 'VICTORY LABS', ['bold' => true, 'size' => 14, 'color' => '0B5394']);
        }

        $rightCell = $headerTable->addCell(Converter::cmToTwip(8));
        $rightCell->addText($documentTitle, ['bold' => true, 'size' => 13, 'color' => '0B5394'], ['alignment' => Jc::RIGHT]);
        
        $metaText = "No: " . ($invoice->no_invoice ?? '-') . "\n";
        $quotationNumber = $approvedQuotation?->quotation_number ?: $jobTicket?->quotations?->first()?->quotation_number;
        if ($quotationNumber) {
            $metaText .= "No. Penawaran: " . $quotationNumber . "\n";
        }
        $customerPoNumber = $invoice->customer_po_number ?: $jobTicket?->customer_po_number;
        if ($customerPoNumber) {
            $metaText .= "No. PO: " . $customerPoNumber . "\n";
        }
        $suratJalanNumber = $jobTicket?->latestSuratJalan?->surat_jalan_number;
        if ($suratJalanNumber) {
            $metaText .= "No. Surat Jalan: " . $suratJalanNumber . "\n";
        }
        $metaText .= "Tanggal: " . ($invoice->created_at ? $invoice->created_at->format('d/m/Y') : now()->format('d/m/Y')) . "\n";
        $metaText .= "Jatuh Tempo: " . ($invoice->tgl_jatuh_tempo ? \Carbon\Carbon::parse($invoice->tgl_jatuh_tempo)->format('d/m/Y') : '-');
        $rightCell->addText($metaText, ['size' => 9], ['alignment' => Jc::RIGHT]);

        $section->addTextBreak(1);

        // Address Section Table
        $addrTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $addrTable->addRow();

        // Company
        $cCell = $addrTable->addCell(Converter::cmToTwip(8.5), ['borderColor' => 'E2E8F0', 'borderSize' => 6, 'bgColor' => 'F8FAFC']);
        $cCell->addText("INFORMASI PERUSAHAAN", ['bold' => true, 'size' => 9, 'color' => '1E293B']);
        $cCell->addText($companyProfile?->company_name ?? 'PT. Victorylab Global Industries', ['bold' => true, 'size' => 10, 'color' => '0B5394']);
        $cCell->addText($companyProfile?->address ?? 'Bandung, Jawa Barat', ['size' => 9]);
        $cCell->addText("Telp: " . ($companyProfile?->phone ?? '081212228900'), ['size' => 9]);
        $cCell->addText("Email: " . ($companyProfile?->email ?? 'marketing@victorylabs.id'), ['size' => 9]);

        $addrTable->addCell(Converter::cmToTwip(0.4)); // Spacer

        // Customer
        $custCell = $addrTable->addCell(Converter::cmToTwip(8.5), ['borderColor' => 'E2E8F0', 'borderSize' => 6, 'bgColor' => 'F8FAFC']);
        $custCell->addText("INFORMASI CUSTOMER", ['bold' => true, 'size' => 9, 'color' => '1E293B']);
        $custCompany = $jobTicket?->customer_perusahaan_snapshot ?: ($customer?->nama_perusahaan ?: $customer?->nama ?: 'Customer');
        $custCell->addText($custCompany, ['bold' => true, 'size' => 10, 'color' => '0B5394']);
        $custCell->addText($customer?->alamat_detail ?? '-', ['size' => 9]);
        $custCell->addText("Telp: " . ($customer?->kontak ?: ($customer?->no_hp ?: '-')), ['size' => 9]);
        $custCell->addText("Up: " . ($jobTicket?->customer_nama_snapshot ?: ($customer?->nama ?: '-')), ['size' => 9]);

        $section->addTextBreak(1);

        // Items Table
        $tableStyle = [
            'borderSize' => 6,
            'borderColor' => 'CBD5E1',
            'cellMargin' => Converter::cmToTwip(0.15),
            'width' => 100 * 50,
            'unit' => 'pct',
            'alignment' => JcTable::CENTER,
        ];
        $firstRowStyle = ['bgColor' => '0B5394'];
        $phpWord->addTableStyle('InvoiceItemsTable', $tableStyle, $firstRowStyle);
        $itemTable = $section->addTable('InvoiceItemsTable');

        $itemTable->addRow();
        $itemTable->addCell(Converter::cmToTwip(1), $firstRowStyle)->addText("No", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER]);
        $itemTable->addCell(Converter::cmToTwip(4.5), $firstRowStyle)->addText("Produk", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9]);
        $itemTable->addCell(Converter::cmToTwip(5.5), $firstRowStyle)->addText("Deskripsi", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9]);
        $itemTable->addCell(Converter::cmToTwip(1.8), $firstRowStyle)->addText("Qty", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER]);
        $itemTable->addCell(Converter::cmToTwip(2.3), $firstRowStyle)->addText("Harga/Pcs", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::RIGHT]);
        $itemTable->addCell(Converter::cmToTwip(2.5), $firstRowStyle)->addText("Subtotal", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::RIGHT]);

        $items = $invoice->items;
        $grandSubtotal = 0;
        foreach ($items as $idx => $item) {
            $subtotal = ($item->subtotal && (float) $item->subtotal > 0)
                ? (float) $item->subtotal
                : ((float) ($item->quantity ?? 0) * (float) ($item->price_per_pcs ?? 0));
            $grandSubtotal += $subtotal;

            $itemTable->addRow();
            $itemTable->addCell(Converter::cmToTwip(1))->addText((string)($idx + 1), ['size' => 9], ['alignment' => Jc::CENTER]);
            $itemTable->addCell(Converter::cmToTwip(4.5))->addText($item->item_name ?? '-', ['bold' => true, 'size' => 9]);
            
            $descText = '';
            if ($item->pesanan && $item->pesanan->sizeBreakdowns) {
                foreach ($item->pesanan->sizeBreakdowns as $b) {
                    $descText .= ($b->color ? $b->color . ' - ' : '') . $b->size_label . ': ' . $b->qty . "pcs\n";
                }
            }
            $itemTable->addCell(Converter::cmToTwip(5.5))->addText(trim($descText) ?: '-', ['size' => 8, 'color' => '475569']);
            $itemTable->addCell(Converter::cmToTwip(1.8))->addText(number_format((float)$item->quantity), ['size' => 9], ['alignment' => Jc::CENTER]);
            $itemTable->addCell(Converter::cmToTwip(2.3))->addText('Rp ' . number_format((float)$item->price_per_pcs, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT]);
            $itemTable->addCell(Converter::cmToTwip(2.5))->addText('Rp ' . number_format($subtotal, 0, ',', '.'), ['bold' => true, 'size' => 9], ['alignment' => Jc::RIGHT]);
        }

        $section->addTextBreak(1);

        // Bottom Section (Notes left, Summary right)
        $bottomTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $bottomTable->addRow();

        // Pesan & Bank
        $pCell = $bottomTable->addCell(Converter::cmToTwip(9.5));
        $pCell->addText("Pesan & Ketentuan Pembayaran:", ['bold' => true, 'size' => 9]);
        if (!empty($invoice->notes)) {
            $pCell->addText("Catatan: " . $invoice->notes, ['size' => 9]);
        }
        if (!empty($customerPoNumber)) {
            $pCell->addText("Nomor PO: " . $customerPoNumber, ['size' => 9]);
        }
        $bankText = "Transfer ke " . ($companyProfile?->bank_type ?? 'BCA') . " " . ($companyProfile?->account_number ?? '453.12.06660') . " a.n. " . ($companyProfile?->account_name ?? 'VICTOR HARLIM.MBA');
        $pCell->addText($bankText, ['size' => 9, 'bold' => true]);

        // Summary Calculations
        $sCell = $bottomTable->addCell(Converter::cmToTwip(7.9));
        $verifiedPaid = (float) $invoice->payments->where('status', 'verified')->sum('jumlah_bayar');
        $totalTagihan = (float) $invoice->total_tagihan;
        $remaining = max(0, $totalTagihan - $verifiedPaid);
        $statusStr = strtoupper($invoice->status_tagihan);

        $sCell->addText("Subtotal: Rp " . number_format($grandSubtotal > 0 ? $grandSubtotal : $totalTagihan, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT]);
        if ((float) $invoice->delivery_cost > 0) {
            $sCell->addText("Ongkir: Rp " . number_format((float) $invoice->delivery_cost, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT]);
        }
        $sCell->addText("Total: Rp " . number_format($totalTagihan, 0, ',', '.'), ['bold' => true, 'size' => 10], ['alignment' => Jc::RIGHT]);
        $sCell->addText("Paid: Rp " . number_format($verifiedPaid, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT]);
        $sCell->addText("Remaining: Rp " . number_format($remaining, 0, ',', '.'), ['bold' => true, 'size' => 10, 'color' => '0B5394'], ['alignment' => Jc::RIGHT]);
        $sCell->addText("Status Pembayaran: " . $statusStr, ['bold' => true, 'size' => 9, 'color' => '15803D'], ['alignment' => Jc::RIGHT]);

        $section->addTextBreak(1);

        // Signature Section
        $sigTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $sigTable->addRow();
        $sigTable->addCell(Converter::cmToTwip(11)); // Spacer
        $sigCell = $sigTable->addCell(Converter::cmToTwip(6.4));
        $sigCell->addText("Dengan Hormat,", ['size' => 9], ['alignment' => Jc::CENTER]);
        
        $owner = User::whereHas('roles', fn ($q) => $q->where('name', 'Owner'))->first();
        $sigPath = $owner?->signature ? storage_path('app/public/' . $owner->signature) : null;
        if ($sigPath && file_exists($sigPath)) {
            $sigCell->addImage($sigPath, ['width' => 100, 'height' => 45, 'alignment' => Jc::CENTER]);
        } else {
            $sigCell->addTextBreak(2);
        }
        $sigCell->addText($owner?->name ?? 'Direktur', ['bold' => true, 'underline' => 'single', 'size' => 10], ['alignment' => Jc::CENTER]);
        $sigCell->addText("Direktur", ['size' => 9], ['alignment' => Jc::CENTER]);

        $tempFile = tempnam(sys_get_temp_dir(), 'inv_docx_');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        return $tempFile;
    }

    /**
     * Create a Quotation docx document
     */
    public function generateQuotationDocx(Quotation $quotation): string
    {
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(10);

        $section = $phpWord->addSection([
            'marginTop' => Converter::cmToTwip(1.5),
            'marginBottom' => Converter::cmToTwip(1.5),
            'marginLeft' => Converter::cmToTwip(1.8),
            'marginRight' => Converter::cmToTwip(1.8),
        ]);

        $jobTicket = $quotation->jobTicket;
        $companyProfile = $quotation->companyProfile ?: $jobTicket?->companyProfile;
        $customer = $jobTicket?->customer ?: $quotation->customer;

        // Header Table
        $headerTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $headerTable->addRow();
        
        $leftCell = $headerTable->addCell(Converter::cmToTwip(9));
        $logoPath = public_path('images/logo.png');
        if (file_exists($logoPath)) {
            $leftCell->addImage($logoPath, ['width' => 140, 'height' => 38]);
        } else {
            $leftCell->addText($companyProfile?->company_name ?? 'VICTORY LABS', ['bold' => true, 'size' => 14, 'color' => '0B5394']);
        }

        $rightCell = $headerTable->addCell(Converter::cmToTwip(8));
        $rightCell->addText("PENAWARAN HARGA", ['bold' => true, 'size' => 13, 'color' => '0B5394'], ['alignment' => Jc::RIGHT]);
        
        $metaText = "Nomor: " . $quotation->quotation_number . "\n";
        $metaText .= "Tanggal: " . ($quotation->created_at ? $quotation->created_at->format('d/m/Y') : now()->format('d/m/Y')) . "\n";
        $metaText .= "Tgl. Jatuh Tempo: " . ($quotation->valid_until ? \Carbon\Carbon::parse($quotation->valid_until)->format('d/m/Y') : '-');
        $rightCell->addText($metaText, ['size' => 9], ['alignment' => Jc::RIGHT]);

        $section->addTextBreak(1);

        // Address Section
        $addrTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $addrTable->addRow();

        $cCell = $addrTable->addCell(Converter::cmToTwip(8.5), ['borderColor' => 'E2E8F0', 'borderSize' => 6, 'bgColor' => 'F8FAFC']);
        $cCell->addText("INFORMASI PERUSAHAAN", ['bold' => true, 'size' => 9, 'color' => '1E293B']);
        $cCell->addText($companyProfile?->company_name ?? 'PT. Victorylab Global Industries', ['bold' => true, 'size' => 10, 'color' => '0B5394']);
        $cCell->addText($companyProfile?->address ?? 'Bandung, Jawa Barat', ['size' => 9]);
        $cCell->addText("Telp: " . ($companyProfile?->phone ?? '081212228900'), ['size' => 9]);

        $addrTable->addCell(Converter::cmToTwip(0.4));

        $custCell = $addrTable->addCell(Converter::cmToTwip(8.5), ['borderColor' => 'E2E8F0', 'borderSize' => 6, 'bgColor' => 'F8FAFC']);
        $custCell->addText("PENAWARAN KEPADA", ['bold' => true, 'size' => 9, 'color' => '1E293B']);
        $custCompany = $jobTicket?->customer_perusahaan_snapshot ?: ($customer?->nama_perusahaan ?: $customer?->nama ?: 'Customer');
        $custCell->addText($custCompany, ['bold' => true, 'size' => 10, 'color' => '0B5394']);
        $custCell->addText($customer?->alamat_detail ?? '-', ['size' => 9]);
        $custCell->addText("Telp: " . ($customer?->kontak ?: ($customer?->no_hp ?: '-')), ['size' => 9]);

        $section->addTextBreak(1);

        // Items Table
        $tableStyle = [
            'borderSize' => 6,
            'borderColor' => 'CBD5E1',
            'cellMargin' => Converter::cmToTwip(0.15),
            'width' => 100 * 50,
            'unit' => 'pct',
            'alignment' => JcTable::CENTER,
        ];
        $firstRowStyle = ['bgColor' => '0B5394'];
        $phpWord->addTableStyle('QuotationItemsTable', $tableStyle, $firstRowStyle);
        $itemTable = $section->addTable('QuotationItemsTable');

        $itemTable->addRow();
        $itemTable->addCell(Converter::cmToTwip(4.5), $firstRowStyle)->addText("Produk", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9]);
        $itemTable->addCell(Converter::cmToTwip(6), $firstRowStyle)->addText("Deskripsi", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9]);
        $itemTable->addCell(Converter::cmToTwip(1.8), $firstRowStyle)->addText("Qty", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER]);
        $itemTable->addCell(Converter::cmToTwip(2.5), $firstRowStyle)->addText("Harga Satuan", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::RIGHT]);
        $itemTable->addCell(Converter::cmToTwip(2.6), $firstRowStyle)->addText("Total", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::RIGHT]);

        foreach ($quotation->items as $item) {
            $itemTotal = ($item->subtotal && (float) $item->subtotal > 0)
                ? (float) $item->subtotal
                : ((float) $item->quantity * (float) $item->price_per_pcs);

            $itemTable->addRow();
            $itemTable->addCell(Converter::cmToTwip(4.5))->addText($item->item_name ?? '-', ['bold' => true, 'size' => 9]);
            $desc = '';
            if ($item->fabric) $desc .= "Bahan: " . $item->fabric . "\n";
            if ($item->print_method) $desc .= "Metode: " . $item->print_method;
            $itemTable->addCell(Converter::cmToTwip(6))->addText(trim($desc) ?: '-', ['size' => 8, 'color' => '475569']);
            $itemTable->addCell(Converter::cmToTwip(1.8))->addText(number_format((float)$item->quantity), ['size' => 9], ['alignment' => Jc::CENTER]);
            $itemTable->addCell(Converter::cmToTwip(2.5))->addText('Rp ' . number_format((float)$item->price_per_pcs, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT]);
            $itemTable->addCell(Converter::cmToTwip(2.6))->addText('Rp ' . number_format($itemTotal, 0, ',', '.'), ['bold' => true, 'size' => 9], ['alignment' => Jc::RIGHT]);
        }

        $section->addTextBreak(1);

        // Bottom Table
        $bottomTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $bottomTable->addRow();

        $pCell = $bottomTable->addCell(Converter::cmToTwip(9.5));
        $pCell->addText("Pesan & Ketentuan:", ['bold' => true, 'size' => 9]);
        if ($quotation->payment_terms) $pCell->addText($quotation->payment_terms, ['size' => 9]);
        if ($quotation->delivery_terms) $pCell->addText($quotation->delivery_terms, ['size' => 9]);
        if ($quotation->notes) $pCell->addText($quotation->notes, ['size' => 9]);

        $sCell = $bottomTable->addCell(Converter::cmToTwip(7.9));
        $sCell->addText("Subtotal: Rp " . number_format((float) $quotation->subtotal, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT]);
        if ((float) $quotation->tax > 0) {
            $sCell->addText("Pajak: Rp " . number_format((float) $quotation->tax, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT]);
        }
        if ((float) $quotation->delivery_cost > 0) {
            $sCell->addText("Ongkir: Rp " . number_format((float) $quotation->delivery_cost, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT]);
        }
        $sCell->addText("Grand Total: Rp " . number_format((float) $quotation->grand_total, 0, ',', '.'), ['bold' => true, 'size' => 11, 'color' => '0B5394'], ['alignment' => Jc::RIGHT]);

        $section->addTextBreak(1);

        // Signature
        $sigTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $sigTable->addRow();
        $sigTable->addCell(Converter::cmToTwip(11));
        $sigCell = $sigTable->addCell(Converter::cmToTwip(6.4));
        $sigCell->addText("Dengan Hormat,", ['size' => 9], ['alignment' => Jc::CENTER]);
        
        $owner = User::whereHas('roles', fn ($q) => $q->where('name', 'Owner'))->first();
        $sigPath = $owner?->signature ? storage_path('app/public/' . $owner->signature) : null;
        if ($sigPath && file_exists($sigPath)) {
            $sigCell->addImage($sigPath, ['width' => 100, 'height' => 45, 'alignment' => Jc::CENTER]);
        } else {
            $sigCell->addTextBreak(2);
        }
        $sigCell->addText($owner?->name ?? 'Direktur', ['bold' => true, 'underline' => 'single', 'size' => 10], ['alignment' => Jc::CENTER]);
        $sigCell->addText("Direktur", ['size' => 9], ['alignment' => Jc::CENTER]);

        $tempFile = tempnam(sys_get_temp_dir(), 'quo_docx_');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        return $tempFile;
    }

    /**
     * Create a Surat Jalan docx document
     */
    public function generateSuratJalanDocx(SuratJalan $suratJalan): string
    {
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(10);

        $section = $phpWord->addSection([
            'marginTop' => Converter::cmToTwip(1.5),
            'marginBottom' => Converter::cmToTwip(1.5),
            'marginLeft' => Converter::cmToTwip(1.8),
            'marginRight' => Converter::cmToTwip(1.8),
        ]);

        $companyProfile = $suratJalan->companyProfile ?: $suratJalan->jobTicket?->companyProfile;

        // Header
        $headerTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $headerTable->addRow();
        
        $leftCell = $headerTable->addCell(Converter::cmToTwip(9));
        $logoPath = public_path('images/logo.png');
        if (file_exists($logoPath)) {
            $leftCell->addImage($logoPath, ['width' => 140, 'height' => 38]);
        } else {
            $leftCell->addText($companyProfile?->company_name ?? 'VICTORY LABS', ['bold' => true, 'size' => 14, 'color' => '0B5394']);
        }

        $rightCell = $headerTable->addCell(Converter::cmToTwip(8));
        $rightCell->addText("SURAT JALAN", ['bold' => true, 'size' => 13, 'color' => '0B5394'], ['alignment' => Jc::RIGHT]);
        
        $metaText = "Nomor: " . $suratJalan->surat_jalan_number . "\n";
        $metaText .= "Tanggal Kirim: " . ($suratJalan->delivery_date ? $suratJalan->delivery_date->format('d/m/Y') : now()->format('d/m/Y')) . "\n";
        if ($suratJalan->courier_name) $metaText .= "Kurir: " . $suratJalan->courier_name . "\n";
        if ($suratJalan->tracking_number) $metaText .= "No. Resi: " . $suratJalan->tracking_number . "\n";
        $rightCell->addText($metaText, ['size' => 9], ['alignment' => Jc::RIGHT]);

        $section->addTextBreak(1);

        // Address Section
        $addrTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $addrTable->addRow();

        $cCell = $addrTable->addCell(Converter::cmToTwip(8.5), ['borderColor' => 'E2E8F0', 'borderSize' => 6, 'bgColor' => 'F8FAFC']);
        $cCell->addText("PENGIRIM", ['bold' => true, 'size' => 9, 'color' => '1E293B']);
        $cCell->addText($companyProfile?->company_name ?? 'PT. Victorylab Global Industries', ['bold' => true, 'size' => 10, 'color' => '0B5394']);
        $cCell->addText($companyProfile?->address ?? 'Bandung, Jawa Barat', ['size' => 9]);

        $addrTable->addCell(Converter::cmToTwip(0.4));

        $custCell = $addrTable->addCell(Converter::cmToTwip(8.5), ['borderColor' => 'E2E8F0', 'borderSize' => 6, 'bgColor' => 'F8FAFC']);
        $custCell->addText("PENERIMA", ['bold' => true, 'size' => 9, 'color' => '1E293B']);
        $custCell->addText($suratJalan->customer_company_snapshot ?: ($suratJalan->customer_name_snapshot ?: 'Customer'), ['bold' => true, 'size' => 10, 'color' => '0B5394']);
        $custCell->addText($suratJalan->customer_address_snapshot ?? '-', ['size' => 9]);
        $custCell->addText("Telp: " . ($suratJalan->customer_phone_snapshot ?? '-'), ['size' => 9]);

        $section->addTextBreak(1);

        // Items Table
        $tableStyle = [
            'borderSize' => 6,
            'borderColor' => 'CBD5E1',
            'cellMargin' => Converter::cmToTwip(0.15),
            'width' => 100 * 50,
            'unit' => 'pct',
            'alignment' => JcTable::CENTER,
        ];
        $firstRowStyle = ['bgColor' => '0B5394'];
        $phpWord->addTableStyle('SjItemsTable', $tableStyle, $firstRowStyle);
        $itemTable = $section->addTable('SjItemsTable');

        $itemTable->addRow();
        $itemTable->addCell(Converter::cmToTwip(1), $firstRowStyle)->addText("No", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER]);
        $itemTable->addCell(Converter::cmToTwip(6.5), $firstRowStyle)->addText("Nama Barang", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9]);
        $itemTable->addCell(Converter::cmToTwip(7.5), $firstRowStyle)->addText("Keterangan", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9]);
        $itemTable->addCell(Converter::cmToTwip(2.4), $firstRowStyle)->addText("Qty (Pcs)", ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER]);

        $items = $suratJalan->items;
        foreach ($items as $idx => $item) {
            $itemTable->addRow();
            $itemTable->addCell(Converter::cmToTwip(1))->addText((string)($idx + 1), ['size' => 9], ['alignment' => Jc::CENTER]);
            $itemTable->addCell(Converter::cmToTwip(6.5))->addText($item->item_name ?? '-', ['bold' => true, 'size' => 9]);
            $itemTable->addCell(Converter::cmToTwip(7.5))->addText($item->description ?? '-', ['size' => 8, 'color' => '475569']);
            $itemTable->addCell(Converter::cmToTwip(2.4))->addText(number_format((float)$item->quantity), ['bold' => true, 'size' => 9], ['alignment' => Jc::CENTER]);
        }

        $section->addTextBreak(1);

        // Signatures (Diterima Oleh & Dikirim Oleh)
        $sigTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $sigTable->addRow();
        
        $penerimaCell = $sigTable->addCell(Converter::cmToTwip(8.7));
        $penerimaCell->addText("Diterima Oleh,", ['size' => 9], ['alignment' => Jc::CENTER]);
        $penerimaCell->addTextBreak(3);
        $penerimaCell->addText("( .............................. )", ['size' => 9], ['alignment' => Jc::CENTER]);

        $pengirimCell = $sigTable->addCell(Converter::cmToTwip(8.7));
        $pengirimCell->addText("Dengan Hormat,", ['size' => 9], ['alignment' => Jc::CENTER]);
        $owner = User::whereHas('roles', fn ($q) => $q->where('name', 'Owner'))->first();
        $sigPath = $owner?->signature ? storage_path('app/public/' . $owner->signature) : null;
        if ($sigPath && file_exists($sigPath)) {
            $pengirimCell->addImage($sigPath, ['width' => 100, 'height' => 45, 'alignment' => Jc::CENTER]);
        } else {
            $pengirimCell->addTextBreak(2);
        }
        $pengirimCell->addText("VictoryLabs", ['bold' => true, 'size' => 10, 'color' => '0B5394'], ['alignment' => Jc::CENTER]);

        $tempFile = tempnam(sys_get_temp_dir(), 'sj_docx_');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        return $tempFile;
    }
}

