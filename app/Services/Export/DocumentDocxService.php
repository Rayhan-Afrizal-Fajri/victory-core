<?php

namespace App\Services\Export;

use App\Models\CompanyProfile;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\SuratJalan;
use App\Models\User;
use App\Support\ProductionInvoiceDocumentAmounts;
use Carbon\Carbon;
use PhpOffice\PhpWord\Element\AbstractContainer;
use PhpOffice\PhpWord\Element\Section;
use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\Shared\Converter;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\SimpleType\JcTable;

class DocumentDocxService
{
    /**
     * Initialize PhpWord with XML output escaping enabled and compact paragraph defaults.
     */
    private function createPhpWord(): PhpWord
    {
        Settings::setOutputEscapingEnabled(true);

        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(9.5);
        $phpWord->setDefaultParagraphStyle([
            'spaceBefore' => 0,
            'spaceAfter' => 30,
            'lineHeight' => 1.15,
        ]);

        return $phpWord;
    }

    private function createSection(PhpWord $phpWord): Section
    {
        return $phpWord->addSection([
            'marginTop' => Converter::cmToTwip(1.4),
            'marginBottom' => Converter::cmToTwip(1.4),
            'marginLeft' => Converter::cmToTwip(1.8),
            'marginRight' => Converter::cmToTwip(1.8),
        ]);
    }

    /**
     * Add an image while preserving its original aspect ratio within the target bounding box.
     *
     * @param  array<string, mixed>  $extraStyle
     */
    private function addProportionalImage(
        AbstractContainer $container,
        string $path,
        float $maxWidthPt,
        float $maxHeightPt,
        array $extraStyle = []
    ): void {
        $dimensions = @getimagesize($path);
        if (is_array($dimensions) && ($dimensions[0] ?? 0) > 0 && ($dimensions[1] ?? 0) > 0) {
            $scale = min($maxWidthPt / $dimensions[0], $maxHeightPt / $dimensions[1]);
            $style = array_merge($extraStyle, [
                'width' => round($dimensions[0] * $scale, 2),
                'height' => round($dimensions[1] * $scale, 2),
            ]);
        } else {
            $style = array_merge($extraStyle, ['width' => $maxWidthPt]);
        }

        $container->addImage($path, $style);
    }

    /**
     * Render multi-line text as separate paragraphs because OOXML ignores raw "\n" inside <w:t>.
     *
     * @param  array<string, mixed>  $fontStyle
     * @param  array<string, mixed>  $paragraphStyle
     */
    private function addMultilineText(
        AbstractContainer $container,
        ?string $text,
        array $fontStyle = [],
        array $paragraphStyle = [],
        string $fallback = '-'
    ): void {
        $normalized = str_replace(["\r\n", "\r"], "\n", trim((string) $text));
        if ($normalized === '') {
            if ($fallback !== '') {
                $container->addText($fallback, $fontStyle, $paragraphStyle);
            }

            return;
        }

        $lines = explode("\n", $normalized);
        $hasRendered = false;
        $pendingGap = false;

        foreach ($lines as $line) {
            $trimmedLine = rtrim($line);
            if ($trimmedLine === '') {
                if ($hasRendered) {
                    $pendingGap = true;
                }

                continue;
            }

            $lineParagraphStyle = $paragraphStyle;
            if ($pendingGap) {
                $lineParagraphStyle['spaceBefore'] = ($lineParagraphStyle['spaceBefore'] ?? 0) + 70;
                $pendingGap = false;
            }

            $container->addText($trimmedLine, $fontStyle, $lineParagraphStyle);
            $hasRendered = true;
        }
    }

    /**
     * Render the shared top header (proportional logo on the left, title + aligned meta rows on the right).
     *
     * @param  array<int, array{label: string, value: string, bold?: bool, muted?: bool}>  $metaRows
     */
    private function addHeaderSection(
        Section $section,
        ?CompanyProfile $companyProfile,
        string $headerTitle,
        array $metaRows
    ): void {
        $headerTable = $section->addTable([
            'width' => 100 * 50,
            'unit' => 'pct',
            'alignment' => JcTable::CENTER,
            'cellMarginTop' => 0,
            'cellMarginBottom' => 0,
            'cellMarginLeft' => 0,
            'cellMarginRight' => 0,
        ]);
        $headerTable->addRow();

        $leftCell = $headerTable->addCell(Converter::cmToTwip(7.8));
        $logoPath = public_path('images/logo.png');
        if (file_exists($logoPath)) {
            $this->addProportionalImage($leftCell, $logoPath, 210, 34);
        } else {
            $leftCell->addText(
                $companyProfile?->company_name ?? 'VICTORY LABS',
                ['bold' => true, 'size' => 14, 'color' => '0B5394']
            );
        }

        $rightCell = $headerTable->addCell(Converter::cmToTwip(9.6));
        $rightCell->addText(
            $headerTitle,
            ['bold' => true, 'size' => 14, 'color' => '0B5394'],
            ['alignment' => Jc::RIGHT, 'spaceAfter' => 60]
        );

        $metaTable = $rightCell->addTable([
            'alignment' => JcTable::END,
            'cellMarginTop' => 15,
            'cellMarginBottom' => 15,
            'cellMarginLeft' => 60,
            'cellMarginRight' => 0,
        ]);

        foreach ($metaRows as $row) {
            $color = ($row['muted'] ?? false) ? '6B7280' : '111827';
            $metaTable->addRow();
            $metaTable->addCell(Converter::cmToTwip(4.2))->addText(
                $row['label'],
                ['size' => 9, 'color' => $color],
                ['alignment' => Jc::RIGHT, 'spaceBefore' => 0, 'spaceAfter' => 0]
            );
            $metaTable->addCell(Converter::cmToTwip(5.0))->addText(
                $row['value'],
                ['size' => 9, 'bold' => $row['bold'] ?? false, 'color' => $color],
                ['alignment' => Jc::LEFT, 'spaceBefore' => 0, 'spaceAfter' => 0]
            );
        }
    }

    private function addSectionHeader(AbstractContainer $container, string $title): void
    {
        $container->addText(
            $title,
            ['bold' => true, 'size' => 10, 'color' => '111827'],
            ['borderBottomSize' => 6, 'borderBottomColor' => '111827', 'spaceAfter' => 80]
        );
    }

    /**
     * @param  array<string, mixed>  $labelFont
     * @param  array<string, mixed>  $valueFont
     */
    private function addSummaryRow(
        Table $table,
        string $label,
        string $value,
        array $labelFont = ['size' => 9, 'bold' => true, 'color' => '111827'],
        array $valueFont = ['size' => 9, 'bold' => true, 'color' => '111827']
    ): void {
        $table->addRow();
        $table->addCell(Converter::cmToTwip(4.2))->addText(
            $label,
            $labelFont,
            ['alignment' => Jc::RIGHT, 'spaceBefore' => 0, 'spaceAfter' => 20]
        );
        $table->addCell(Converter::cmToTwip(3.6))->addText(
            $value,
            $valueFont,
            ['alignment' => Jc::RIGHT, 'spaceBefore' => 0, 'spaceAfter' => 20]
        );
    }

    private function resolveOwner(): ?User
    {
        return User::whereHas('roles', fn ($q) => $q->where('name', 'Owner'))->first();
    }

    private function resolveSignaturePath(?User $owner): ?string
    {
        $sigPath = $owner?->signature ? storage_path('app/public/' . $owner->signature) : null;
        if ($sigPath && file_exists($sigPath)) {
            return $sigPath;
        }

        $available = glob(storage_path('app/public/signatures/*.png'));

        return ! empty($available) ? $available[0] : null;
    }

    /**
     * Create an Invoice docx document
     */
    public function generateInvoiceDocx(Invoice $invoice, ?string $documentType = null): string
    {
        $phpWord = $this->createPhpWord();
        $section = $this->createSection($phpWord);

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
            'dp' => "DP Produksi ({$dpLabelPct}%)",
            'settlement' => "Pelunasan Produksi ({$settlementLabelPct}%)",
            'full' => 'Invoice',
            default => null,
        };

        $headerTitle = $documentTitle
            ? (str_starts_with(strtoupper($documentTitle), 'INVOICE')
                ? strtoupper($documentTitle)
                : 'INVOICE - ' . strtoupper($documentTitle))
            : 'INVOICE';

        $quotationNumber = $approvedQuotation?->quotation_number ?: $jobTicket?->quotations?->first()?->quotation_number;
        $customerPoNumber = $invoice->customer_po_number ?: $jobTicket?->customer_po_number;
        $suratJalanNumber = $jobTicket?->latestSuratJalan?->surat_jalan_number;

        $metaRows = [
            ['label' => 'No Invoice', 'value' => $invoice->no_invoice ?? '-', 'bold' => true],
        ];
        if (! empty($quotationNumber)) {
            $metaRows[] = ['label' => 'No. Penawaran', 'value' => $quotationNumber];
        }
        if (! empty($customerPoNumber)) {
            $metaRows[] = ['label' => 'No. PO', 'value' => $customerPoNumber, 'bold' => true];
        }
        if (! empty($suratJalanNumber)) {
            $metaRows[] = ['label' => 'No. Surat Jalan', 'value' => $suratJalanNumber];
        }
        $metaRows[] = [
            'label' => 'Tanggal',
            'value' => $invoice->created_at ? $invoice->created_at->format('d/m/Y') : now()->format('d/m/Y'),
        ];
        $metaRows[] = [
            'label' => 'Tgl. Jatuh Tempo',
            'value' => $invoice->tgl_jatuh_tempo ? Carbon::parse($invoice->tgl_jatuh_tempo)->format('d/m/Y') : '-',
        ];

        $this->addHeaderSection($section, $companyProfile, $headerTitle, $metaRows);

        $section->addTextBreak(1);

        // Center Banner Title matching PDF
        if ($documentTitle) {
            if (str_starts_with(strtoupper($documentTitle), 'INVOICE')) {
                $section->addText(strtoupper($documentTitle), ['bold' => true, 'size' => 15, 'color' => '0B5394'], ['alignment' => Jc::CENTER]);
            } else {
                $section->addText(strtoupper($documentTitle), ['bold' => true, 'size' => 15, 'color' => '0B5394'], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
                $section->addText('INVOICE', ['bold' => true, 'size' => 15, 'color' => '0B5394'], ['alignment' => Jc::CENTER]);
            }
        } else {
            if (strtolower((string) $invoice->kategori_invoice) === 'sample') {
                $section->addText('SAMPLE', ['bold' => true, 'size' => 15, 'color' => '0B5394'], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
                $section->addText('PROFORMA INVOICE', ['bold' => true, 'size' => 15, 'color' => '0B5394'], ['alignment' => Jc::CENTER]);
            } else {
                $section->addText('INVOICE', ['bold' => true, 'size' => 15, 'color' => '0B5394'], ['alignment' => Jc::CENTER]);
            }
        }

        $section->addTextBreak(1);

        $isPkp = $companyProfile && $companyProfile->company_type === 'pkp';
        $taxPercentage = $isPkp ? (float) ($companyProfile->tax_percentage ?? 0) : 0;

        // Address Section Table
        $addrTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $addrTable->addRow();

        // Company
        $cCell = $addrTable->addCell(Converter::cmToTwip(8.5));
        $this->addSectionHeader($cCell, 'Informasi Perusahaan');
        $companyRun = $cCell->addTextRun(['spaceAfter' => 40]);
        $companyRun->addText($companyProfile?->company_name ?? 'PT. Victorylab Global Industries', ['bold' => true, 'size' => 10, 'color' => '0B5394']);
        if ($isPkp) {
            $companyRun->addText("  (PKP - PPN {$taxPercentage}%)", ['size' => 8, 'color' => '1E40AF', 'bold' => true]);
        }
        $this->addMultilineText(
            $cCell,
            'Headquarters : ' . ($companyProfile?->address ?? 'Ruko Kopo Plaza F - 9, Kota Bandung, Jawa Barat 40233'),
            ['size' => 9]
        );
        $cCell->addText('Telp: ' . ($companyProfile?->phone ?? '081212228900'), ['size' => 9]);
        $cCell->addText('Email: ' . ($companyProfile?->email ?? 'marketing@victorylabs.id'), ['size' => 9]);
        $cCell->addText('Rek: ' . ($companyProfile?->bank_type ?? 'BCA'), ['size' => 9]);
        $cCell->addText('No Rek: ' . ($companyProfile?->account_number ?? '453.12.06660'), ['size' => 9]);

        $addrTable->addCell(Converter::cmToTwip(0.4)); // Spacer

        // Customer
        $custCell = $addrTable->addCell(Converter::cmToTwip(8.5));
        $this->addSectionHeader($custCell, 'Informasi Customer');
        $custCompany = $jobTicket?->customer_perusahaan_snapshot ?: ($customer?->nama_perusahaan ?: $customer?->nama ?: 'Customer');
        $custCell->addText($custCompany, ['bold' => true, 'size' => 10, 'color' => '0B5394'], ['spaceAfter' => 40]);
        $this->addMultilineText($custCell, $customer?->alamat_detail ?? '-', ['size' => 9]);
        $custCell->addText('Telp: ' . ($customer?->kontak ?: ($customer?->no_hp ?: '-')), ['size' => 9]);
        $custCell->addText('Up: ' . ($jobTicket?->customer_nama_snapshot ?: ($customer?->nama ?: '-')), ['size' => 9]);

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
        $itemTable->addCell(Converter::cmToTwip(1), $firstRowStyle)->addText('No', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(4.5), $firstRowStyle)->addText('Produk', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(5.5), $firstRowStyle)->addText('Deskripsi', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(1.8), $firstRowStyle)->addText('Qty', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(2.3), $firstRowStyle)->addText('Harga / Pcs', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(2.5), $firstRowStyle)->addText('Subtotal', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]);

        $items = $invoice->items;
        $grandSubtotal = 0;
        foreach ($items as $idx => $item) {
            $subtotal = ($item->subtotal && (float) $item->subtotal > 0)
                ? (float) $item->subtotal
                : ((float) ($item->quantity ?? 0) * (float) ($item->price_per_pcs ?? 0));
            $grandSubtotal += $subtotal;

            $itemTable->addRow();
            $itemTable->addCell(Converter::cmToTwip(1))->addText((string) ($idx + 1), ['size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);

            $productCell = $itemTable->addCell(Converter::cmToTwip(4.5));
            $productCell->addText($item->item_name ?? '-', ['bold' => true, 'size' => 9], ['spaceAfter' => 0]);
            if ($item->pesanan?->product?->category) {
                $productCell->addText($item->pesanan->product->category, ['size' => 8, 'color' => '6B7280'], ['spaceAfter' => 0]);
            }

            $descCell = $itemTable->addCell(Converter::cmToTwip(5.5));
            if ($item->pesanan && $item->pesanan->sizeBreakdowns && $item->pesanan->sizeBreakdowns->count() > 0) {
                foreach ($item->pesanan->sizeBreakdowns as $b) {
                    $line = ($b->color ? $b->color . ' - ' : '') . $b->size_label . ': ' . $b->qty . 'pcs';
                    if (! empty($b->fabric_spec)) {
                        $line .= ' (' . $b->fabric_spec . ')';
                    }
                    $descCell->addText($line, ['size' => 8, 'color' => '374151'], ['spaceAfter' => 15]);
                }
            } else {
                $descCell->addText('-', ['size' => 8, 'color' => '475569'], ['spaceAfter' => 0]);
            }

            $itemTable->addCell(Converter::cmToTwip(1.8))->addText(number_format((float) $item->quantity), ['size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
            $itemTable->addCell(Converter::cmToTwip(2.3))->addText('Rp ' . number_format((float) $item->price_per_pcs, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]);
            $itemTable->addCell(Converter::cmToTwip(2.5))->addText('Rp ' . number_format($subtotal, 0, ',', '.'), ['bold' => true, 'size' => 9], ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]);
        }

        $section->addTextBreak(1);

        // Bottom Section (Notes left, Summary right)
        $bottomTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $bottomTable->addRow();

        // Pesan & Bank
        $pCell = $bottomTable->addCell(Converter::cmToTwip(9.4));
        $this->addSectionHeader($pCell, 'Pesan');
        if (! empty($invoice->notes)) {
            $this->addMultilineText($pCell, 'Catatan Invoice: ' . $invoice->notes, ['size' => 9]);
        }
        if (! empty($customerPoNumber)) {
            $poRun = $pCell->addTextRun();
            $poRun->addText('No. PO Customer: ', ['bold' => true, 'size' => 9]);
            $poRun->addText($customerPoNumber, ['size' => 9]);
        }
        $bankRun = $pCell->addTextRun();
        $bankRun->addText('Untuk pembayaran mohon untuk ditransfer ke ', ['size' => 9]);
        $bankRun->addText($companyProfile?->bank_type ?? 'BCA', ['bold' => true, 'size' => 9]);
        $bankRun->addText(', no acc ', ['size' => 9]);
        $bankRun->addText($companyProfile?->account_number ?? '453.12.06660', ['bold' => true, 'size' => 9]);
        $bankRun->addText(', Atas nama ', ['size' => 9]);
        $bankRun->addText(strtoupper($companyProfile?->account_name ?? 'VICTOR HARLIM.MBA') . '.', ['bold' => true, 'size' => 9]);

        // Spacer
        $bottomTable->addCell(Converter::cmToTwip(0.4));

        // Summary Calculations
        $sCell = $bottomTable->addCell(Converter::cmToTwip(7.8));
        $verifiedPaid = (float) $invoice->payments->where('status', 'verified')->sum('jumlah_bayar');
        $totalTagihan = (float) $invoice->total_tagihan;

        $fullTax = (float) ($approvedQuotation?->tax ?? 0);
        if ($fullTax <= 0 && $isPkp && $taxPercentage > 0) {
            $baseAmount = max(0, $totalTagihan - (float) $invoice->delivery_cost);
            $fullTax = round($baseAmount * ($taxPercentage / (100 + $taxPercentage)), 2);
        }

        if (in_array($documentType, ['dp', 'settlement'], true)) {
            $documentAmounts = ProductionInvoiceDocumentAmounts::calculate($totalTagihan, $verifiedPaid, $dpPercentage);
            $displayTotal = $documentType === 'dp' ? $documentAmounts['dp_total'] : $documentAmounts['settlement_total'];
            $displayPaid = $documentType === 'dp' ? $documentAmounts['dp_paid'] : $documentAmounts['settlement_paid'];
            $displayRemaining = $documentType === 'dp' ? $documentAmounts['dp_remaining'] : $documentAmounts['settlement_remaining'];
            $displayDeliveryCost = $documentType === 'dp'
                ? (float) $invoice->delivery_cost * ($dpPercentage / 100)
                : (float) $invoice->delivery_cost * ((100 - $dpPercentage) / 100);
            $documentTax = $documentType === 'dp'
                ? round($fullTax * ($dpPercentage / 100), 2)
                : round($fullTax * ((100 - $dpPercentage) / 100), 2);
            $statusStr = in_array(strtolower((string) $invoice->status_tagihan), ['cancelled'], true)
                ? strtoupper((string) $invoice->status_tagihan)
                : ($displayRemaining <= 0 ? 'PAID' : ($displayPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'));
            $totalLabel = $documentType === 'dp'
                ? "Tagihan DP ({$dpLabelPct}%)"
                : "Tagihan Pelunasan ({$settlementLabelPct}%)";
        } else {
            $displayTotal = $totalTagihan;
            $displayPaid = $verifiedPaid;
            $displayRemaining = max(0, $totalTagihan - $verifiedPaid);
            $displayDeliveryCost = (float) $invoice->delivery_cost;
            $documentTax = $fullTax;
            $statusStr = strtoupper((string) $invoice->status_tagihan);
            $totalLabel = $documentType === 'full' ? 'Total Tagihan (100%)' : 'Total Amount';
        }

        $summaryTable = $sCell->addTable(['width' => 100 * 50, 'unit' => 'pct', 'cellMarginTop' => 20, 'cellMarginBottom' => 20]);
        $this->addSummaryRow(
            $summaryTable,
            $documentTitle ? 'Nilai Produksi' : 'Subtotal',
            'Rp ' . number_format($grandSubtotal > 0 ? $grandSubtotal : $totalTagihan, 0, ',', '.')
        );
        if ($isPkp && $documentTax > 0) {
            $this->addSummaryRow(
                $summaryTable,
                "Pajak PPN ({$taxPercentage}%)",
                'Rp ' . number_format($documentTax, 0, ',', '.')
            );
        }
        if ($displayDeliveryCost > 0) {
            $this->addSummaryRow(
                $summaryTable,
                'Biaya Pengiriman',
                'Rp ' . number_format($displayDeliveryCost, 0, ',', '.')
            );
        }
        $this->addSummaryRow($summaryTable, $totalLabel, 'Rp ' . number_format($displayTotal, 0, ',', '.'));
        $this->addSummaryRow($summaryTable, 'Paid', 'Rp ' . number_format($displayPaid, 0, ',', '.'));
        $this->addSummaryRow(
            $summaryTable,
            'Remaining',
            'Rp ' . number_format($displayRemaining, 0, ',', '.'),
            ['size' => 11, 'bold' => true, 'color' => '111827'],
            ['size' => 11, 'bold' => true, 'color' => '0B5394']
        );

        $statusColor = match (strtolower($statusStr)) {
            'paid', 'lunas' => '166534',
            'partially_paid', 'sebagian' => '92400E',
            default => '991B1B',
        };
        $this->addSummaryRow(
            $summaryTable,
            'Status Pembayaran',
            $statusStr,
            ['size' => 9, 'bold' => true, 'color' => '111827'],
            ['size' => 9, 'bold' => true, 'color' => $statusColor]
        );

        $section->addTextBreak(1);

        // Signature Section
        $sigTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $sigTable->addRow();
        $sigTable->addCell(Converter::cmToTwip(11)); // Spacer
        $sigCell = $sigTable->addCell(Converter::cmToTwip(6.4));
        $sigCell->addText('Dengan Hormat,', ['size' => 9], ['alignment' => Jc::CENTER]);

        $owner = $this->resolveOwner();
        $sigPath = $this->resolveSignaturePath($owner);
        if ($sigPath) {
            $this->addProportionalImage($sigCell, $sigPath, 110, 48, ['alignment' => Jc::CENTER]);
        } else {
            $sigCell->addTextBreak(2);
        }
        $sigCell->addText($owner?->name ?? 'Direktur', ['bold' => true, 'underline' => 'single', 'size' => 10], ['alignment' => Jc::CENTER, 'spaceAfter' => 10]);
        $sigCell->addText('Direktur', ['size' => 9], ['alignment' => Jc::CENTER]);

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
        $phpWord = $this->createPhpWord();
        $section = $this->createSection($phpWord);

        $jobTicket = $quotation->jobTicket;
        $companyProfile = $quotation->companyProfile ?: $jobTicket?->companyProfile;
        $customer = $jobTicket?->customer ?: $quotation->customer;

        $metaRows = [
            ['label' => 'Nomor', 'value' => $quotation->quotation_number ?? '-', 'bold' => true],
            [
                'label' => 'Tanggal',
                'value' => $quotation->created_at ? $quotation->created_at->format('d/m/Y') : now()->format('d/m/Y'),
            ],
            [
                'label' => 'Tgl. Jatuh Tempo',
                'value' => $quotation->valid_until ? Carbon::parse($quotation->valid_until)->format('d/m/Y') : '-',
            ],
        ];

        $this->addHeaderSection($section, $companyProfile, 'PENAWARAN', $metaRows);

        $section->addTextBreak(1);

        $isPkp = $companyProfile && $companyProfile->company_type === 'pkp';

        // Address Section
        $addrTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $addrTable->addRow();

        $cCell = $addrTable->addCell(Converter::cmToTwip(8.5));
        $this->addSectionHeader($cCell, 'Informasi Perusahaan');
        $companyRun = $cCell->addTextRun(['spaceAfter' => 40]);
        $companyRun->addText($companyProfile?->company_name ?? 'PT. Victorylab Global Industries', ['bold' => true, 'size' => 10, 'color' => '0B5394']);
        if ($isPkp) {
            $companyRun->addText("  (PKP - PPN {$companyProfile->tax_percentage}%)", ['size' => 8, 'color' => '1E40AF', 'bold' => true]);
        }
        $this->addMultilineText(
            $cCell,
            'Headquarters : ' . ($companyProfile?->address ?? 'Ruko Kopo Plaza F - 9, Kota Bandung, Jawa Barat 40233'),
            ['size' => 9]
        );
        $cCell->addText('Telp: ' . ($companyProfile?->phone ?? '081212228900'), ['size' => 9]);
        $cCell->addText('Email: ' . ($companyProfile?->email ?? 'marketing@victorylabs.id'), ['size' => 9]);

        $addrTable->addCell(Converter::cmToTwip(0.4));

        $custCell = $addrTable->addCell(Converter::cmToTwip(8.5));
        $this->addSectionHeader($custCell, 'Penawaran Kepada');
        $custCompany = $jobTicket?->customer_perusahaan_snapshot
            ?: $quotation->customer_company_snapshot
            ?: $customer?->nama_perusahaan
            ?: $customer?->nama
            ?: 'Customer';
        $custName = $jobTicket?->customer_nama_snapshot
            ?: $quotation->customer_name_snapshot
            ?: $customer?->nama
            ?: $custCompany;
        $custCell->addText($custCompany, ['bold' => true, 'size' => 10, 'color' => '0B5394'], ['spaceAfter' => 40]);
        $this->addMultilineText($custCell, $customer?->alamat_detail ?? $quotation->customer_address_snapshot ?? '-', ['size' => 9]);
        $custCell->addText('Telp: ' . ($quotation->customer_phone_snapshot ?: $customer?->kontak ?: ($customer?->no_hp ?: '-')), ['size' => 9]);
        $custCell->addText('Up: ' . $custName, ['size' => 9]);

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
        $itemTable->addCell(Converter::cmToTwip(4.2), $firstRowStyle)->addText('Produk', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(5.8), $firstRowStyle)->addText('Deskripsi', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(1.8), $firstRowStyle)->addText('Qty', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(1.4), $firstRowStyle)->addText('Satuan', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(2.2), $firstRowStyle)->addText('Harga Satuan', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(2.2), $firstRowStyle)->addText('Total', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]);

        foreach ($quotation->items as $item) {
            $itemTotal = ($item->subtotal && (float) $item->subtotal > 0)
                ? (float) $item->subtotal
                : ((float) $item->quantity * (float) $item->price_per_pcs);

            $itemTable->addRow();
            $itemTable->addCell(Converter::cmToTwip(4.2))->addText($item->item_name ?? '-', ['bold' => true, 'size' => 9], ['spaceAfter' => 0]);

            $descCell = $itemTable->addCell(Converter::cmToTwip(5.8));
            $hasDesc = false;
            if (! empty($item->fabric)) {
                $descCell->addText('Bahan: ' . $item->fabric, ['size' => 8, 'color' => '4B5563'], ['spaceAfter' => 15]);
                $hasDesc = true;
            }
            if (! empty($item->print_method)) {
                $descCell->addText('Metode: ' . $item->print_method, ['size' => 8, 'color' => '4B5563'], ['spaceAfter' => 15]);
                $hasDesc = true;
            }
            if ($item->pesanan && $item->pesanan->sizeBreakdowns && $item->pesanan->sizeBreakdowns->count() > 0) {
                foreach ($item->pesanan->sizeBreakdowns as $b) {
                    $line = ($b->color ? $b->color . ' - ' : '') . $b->size_label . ': ' . $b->qty . 'pcs';
                    $descCell->addText($line, ['size' => 8, 'color' => '374151'], ['spaceAfter' => 15]);
                    $hasDesc = true;
                }
            }
            if (! $hasDesc) {
                $descCell->addText('-', ['size' => 8, 'color' => '475569'], ['spaceAfter' => 0]);
            }

            $itemTable->addCell(Converter::cmToTwip(1.8))->addText(number_format((float) $item->quantity, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
            $itemTable->addCell(Converter::cmToTwip(1.4))->addText('Pcs', ['size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
            $itemTable->addCell(Converter::cmToTwip(2.2))->addText(number_format((float) $item->price_per_pcs, 0, ',', '.'), ['size' => 9], ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]);
            $itemTable->addCell(Converter::cmToTwip(2.2))->addText(number_format($itemTotal, 0, ',', '.'), ['bold' => true, 'size' => 9], ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]);
        }

        $section->addTextBreak(1);

        // Bottom Table
        $bottomTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $bottomTable->addRow();

        $pCell = $bottomTable->addCell(Converter::cmToTwip(9.4));
        $this->addSectionHeader($pCell, 'Pesan');
        if ($quotation->payment_terms) {
            $this->addMultilineText($pCell, $quotation->payment_terms, ['size' => 9], [], '');
        }
        if ($quotation->delivery_terms) {
            $this->addMultilineText($pCell, $quotation->delivery_terms, ['size' => 9], [], '');
        }
        if ($quotation->quotationNotes) {
            foreach ($quotation->quotationNotes as $note) {
                if (! empty($note->notes)) {
                    $this->addMultilineText($pCell, $note->notes, ['size' => 9], [], '');
                }
            }
        }
        if ($quotation->notes) {
            $this->addMultilineText($pCell, $quotation->notes, ['size' => 9], [], '');
        }
        $bankRun = $pCell->addTextRun();
        $bankRun->addText('Untuk pembayaran mohon untuk ditransfer ke ', ['size' => 9]);
        $bankRun->addText($companyProfile?->bank_type ?? 'BCA', ['size' => 9]);
        $bankRun->addText(', no acc ', ['size' => 9]);
        $bankRun->addText($companyProfile?->account_number ?? '453.12.06660', ['bold' => true, 'size' => 9]);
        $bankRun->addText(', Atas nama ', ['size' => 9]);
        $bankRun->addText(strtoupper($companyProfile?->account_name ?? 'VICTOR HARLIM.MBA') . '.', ['bold' => true, 'size' => 9]);

        $bottomTable->addCell(Converter::cmToTwip(0.4));

        $sCell = $bottomTable->addCell(Converter::cmToTwip(7.8));
        $summaryTable = $sCell->addTable(['width' => 100 * 50, 'unit' => 'pct', 'cellMarginTop' => 20, 'cellMarginBottom' => 20]);
        $this->addSummaryRow($summaryTable, 'Subtotal', 'Rp ' . number_format((float) $quotation->subtotal, 0, ',', '.'));
        $taxLabel = $isPkp ? "Pajak PPN ({$companyProfile->tax_percentage}%)" : 'Pajak PPN';
        $this->addSummaryRow($summaryTable, $taxLabel, 'Rp ' . number_format((float) $quotation->tax, 0, ',', '.'));
        $this->addSummaryRow($summaryTable, 'Biaya Pengiriman', 'Rp ' . number_format((float) $quotation->delivery_cost, 0, ',', '.'));
        $this->addSummaryRow(
            $summaryTable,
            'Total',
            'Rp ' . number_format((float) $quotation->grand_total, 0, ',', '.'),
            ['size' => 11, 'bold' => true, 'color' => '111827'],
            ['size' => 11, 'bold' => true, 'color' => '0B5394']
        );

        $section->addTextBreak(1);

        // Signature
        $sigTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $sigTable->addRow();
        $sigTable->addCell(Converter::cmToTwip(11));
        $sigCell = $sigTable->addCell(Converter::cmToTwip(6.4));
        $sigCell->addText('Dengan Hormat,', ['size' => 9], ['alignment' => Jc::CENTER]);

        $owner = $this->resolveOwner();
        $sigPath = $this->resolveSignaturePath($owner);
        if ($sigPath) {
            $this->addProportionalImage($sigCell, $sigPath, 110, 48, ['alignment' => Jc::CENTER]);
        } else {
            $sigCell->addTextBreak(2);
        }
        $sigCell->addText($owner?->name ?? 'Direktur', ['bold' => true, 'underline' => 'single', 'size' => 10], ['alignment' => Jc::CENTER, 'spaceAfter' => 10]);
        $sigCell->addText('Direktur', ['size' => 9], ['alignment' => Jc::CENTER]);

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
        $phpWord = $this->createPhpWord();
        $section = $this->createSection($phpWord);

        $companyProfile = $suratJalan->companyProfile ?: $suratJalan->jobTicket?->companyProfile;

        $metaRows = [
            ['label' => 'Nomor', 'value' => $suratJalan->surat_jalan_number ?? '-', 'bold' => true],
            [
                'label' => 'Tanggal',
                'value' => $suratJalan->delivery_date ? Carbon::parse($suratJalan->delivery_date)->format('d/m/Y') : now()->format('d/m/Y'),
            ],
        ];
        if ($suratJalan->jobTicket) {
            $metaRows[] = [
                'label' => 'No. Job Ticket',
                'value' => $suratJalan->jobTicket->no_job_ticket,
                'muted' => true,
            ];
        }

        $this->addHeaderSection($section, $companyProfile, 'Surat Jalan', $metaRows);

        $section->addTextBreak(1);

        // Address Section
        $addrTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $addrTable->addRow();

        $cCell = $addrTable->addCell(Converter::cmToTwip(8.5));
        $this->addSectionHeader($cCell, 'Informasi Perusahaan');
        $cCell->addText($companyProfile?->company_name ?? 'CV. Victory Mitra Lestari', ['bold' => true, 'size' => 10, 'color' => '0B5394'], ['spaceAfter' => 40]);
        $this->addMultilineText(
            $cCell,
            'Headquarters : ' . ($companyProfile?->address ?? 'Ruko Kopo Plaza F - 9, Kota Bandung, Jawa Barat 40233'),
            ['size' => 9]
        );
        $cCell->addText('Telp: ' . ($companyProfile?->phone ?? '081212228900'), ['size' => 9]);

        $addrTable->addCell(Converter::cmToTwip(0.4));

        $custCell = $addrTable->addCell(Converter::cmToTwip(8.5));
        $this->addSectionHeader($custCell, 'Kepada');
        $custCell->addText(
            $suratJalan->customer_company_snapshot ?: ($suratJalan->customer_name_snapshot ?: 'Customer'),
            ['bold' => true, 'size' => 10, 'color' => '0B5394'],
            ['spaceAfter' => 40]
        );
        $this->addMultilineText($custCell, $suratJalan->customer_address_snapshot ?? '-', ['size' => 9]);
        $phoneText = 'Telp: ' . ($suratJalan->customer_phone_snapshot ?? '-');
        if (! empty($suratJalan->customer_pic_snapshot)) {
            $phoneText .= '   Up: ' . $suratJalan->customer_pic_snapshot;
        }
        $custCell->addText($phoneText, ['size' => 9]);

        if ($suratJalan->courier_name || $suratJalan->tracking_number) {
            $section->addTextBreak(1);
            $courierTable = $section->addTable([
                'width' => 100 * 50,
                'unit' => 'pct',
                'alignment' => JcTable::CENTER,
                'borderSize' => 6,
                'borderColor' => 'BAE6FD',
                'cellMargin' => Converter::cmToTwip(0.15),
            ]);
            $courierTable->addRow();
            $courierCell = $courierTable->addCell(Converter::cmToTwip(17.4), ['bgColor' => 'F0F9FF']);
            $courierRun = $courierCell->addTextRun(['spaceAfter' => 0]);
            $courierRun->addText('Pengiriman via: ', ['bold' => true, 'size' => 9, 'color' => '0369A1']);
            $courierRun->addText($suratJalan->courier_name ?? 'Kurir', ['size' => 9, 'color' => '0369A1']);
            if (! empty($suratJalan->tracking_number)) {
                $courierRun->addText('  |  No. Resi / Tracking: ', ['bold' => true, 'size' => 9, 'color' => '0369A1']);
                $courierRun->addText($suratJalan->tracking_number, ['size' => 9, 'color' => '0369A1']);
            }
            if (! empty($suratJalan->notes)) {
                $courierRun->addText('  |  Catatan: ', ['bold' => true, 'size' => 9, 'color' => '0369A1']);
                $courierRun->addText($suratJalan->notes, ['size' => 9, 'color' => '0369A1']);
            }
        }

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
        $itemTable->addCell(Converter::cmToTwip(4.4), $firstRowStyle)->addText('Produk', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(7.8), $firstRowStyle)->addText('Deskripsi', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(2.6), $firstRowStyle)->addText('Kuantitas', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $itemTable->addCell(Converter::cmToTwip(2.6), $firstRowStyle)->addText('Satuan', ['bold' => true, 'color' => 'FFFFFF', 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);

        $items = $suratJalan->items;
        $computedTotalQty = 0;
        if ($items->count() > 0) {
            foreach ($items as $item) {
                $computedTotalQty += (int) $item->quantity;
                $itemTable->addRow();
                $itemTable->addCell(Converter::cmToTwip(4.4))->addText($item->product_name ?? $item->item_name ?? '-', ['bold' => true, 'size' => 9], ['spaceAfter' => 0]);
                $descCell = $itemTable->addCell(Converter::cmToTwip(7.8));
                $this->addMultilineText($descCell, $item->description ?? '-', ['size' => 8.5, 'color' => '475569'], ['spaceAfter' => 0]);
                $itemTable->addCell(Converter::cmToTwip(2.6))->addText(number_format((float) $item->quantity, 0, ',', '.'), ['bold' => true, 'size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
                $itemTable->addCell(Converter::cmToTwip(2.6))->addText($item->unit ?? 'Pcs', ['size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
            }
        } else {
            $itemTable->addRow();
            $itemTable->addCell(Converter::cmToTwip(17.4), ['gridSpan' => 4])->addText(
                'Tidak ada rincian item pengiriman.',
                ['size' => 9, 'color' => '6B7280'],
                ['alignment' => Jc::CENTER, 'spaceAfter' => 0]
            );
        }

        $totalQty = $suratJalan->total_quantity > 0 ? (int) $suratJalan->total_quantity : $computedTotalQty;
        $itemTable->addRow();
        $itemTable->addCell(Converter::cmToTwip(12.2), ['gridSpan' => 2, 'bgColor' => 'F9FAFB'])->addText(
            'Total Kuantitas',
            ['bold' => true, 'size' => 9],
            ['alignment' => Jc::RIGHT, 'spaceAfter' => 0]
        );
        $itemTable->addCell(Converter::cmToTwip(2.6), ['bgColor' => 'F9FAFB'])->addText(
            number_format($totalQty, 0, ',', '.'),
            ['bold' => true, 'size' => 9],
            ['alignment' => Jc::CENTER, 'spaceAfter' => 0]
        );
        $itemTable->addCell(Converter::cmToTwip(2.6), ['bgColor' => 'F9FAFB'])->addText('', ['size' => 9], ['spaceAfter' => 0]);

        $section->addTextBreak(1);

        // Pesan Section matching PDF
        $this->addSectionHeader($section, 'Pesan');
        $section->addText('Menyatakan bahwa barang yang diterima :', ['bold' => true, 'size' => 9, 'color' => '111827']);
        $section->addText(
            '1. Telah dikirim sesuai dengan spesifikasi dan jangka waktu pengiriman sebagaimana yang ditetapkan dalam Purchase Order (PO) dan dokumen lainnya;',
            ['size' => 9, 'color' => '111827'],
            ['indentation' => ['left' => Converter::cmToTwip(0.4)]]
        );
        $section->addText(
            '2. Dalam keadaan baik dan bebas dari segala cacat dan/atau kerusakan dalam bentuk apapun, serta dapat berfungsi dan digunakan sebagaimana mestinya.',
            ['size' => 9, 'color' => '111827'],
            ['indentation' => ['left' => Converter::cmToTwip(0.4)]]
        );

        $section->addTextBreak(1);

        // Signatures (Diterima Oleh & Dengan Hormat)
        $sigTable = $section->addTable(['width' => 100 * 50, 'unit' => 'pct', 'alignment' => JcTable::CENTER]);
        $sigTable->addRow();

        $penerimaCell = $sigTable->addCell(Converter::cmToTwip(8.7));
        $penerimaCell->addText('Diterima Oleh,', ['size' => 9], ['alignment' => Jc::CENTER]);
        $penerimaCell->addTextBreak(3);
        $penerimaCell->addText('( .............................. )', ['size' => 9], ['alignment' => Jc::CENTER]);

        $pengirimCell = $sigTable->addCell(Converter::cmToTwip(8.7));
        $pengirimCell->addText('Dengan Hormat,', ['size' => 9], ['alignment' => Jc::CENTER]);
        $owner = $this->resolveOwner();
        $sigPath = $this->resolveSignaturePath($owner);
        if ($sigPath) {
            $this->addProportionalImage($pengirimCell, $sigPath, 110, 48, ['alignment' => Jc::CENTER]);
        } else {
            $pengirimCell->addTextBreak(2);
        }
        $pengirimCell->addText('VictoryLabs', ['bold' => true, 'size' => 10, 'color' => '0B5394'], ['alignment' => Jc::CENTER]);

        $tempFile = tempnam(sys_get_temp_dir(), 'sj_docx_');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        return $tempFile;
    }
}
