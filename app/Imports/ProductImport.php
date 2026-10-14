<?php

namespace App\Imports;

use App\Models\DefaultSizeBreakdown;
use App\Models\ManufacturingWork;
use App\Models\Material;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Supplier;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductImport implements ToCollection
{
    /**
     * Cache for resolved suppliers, units, materials, works to optimize performance during bulk sheet processing
     */
    protected array $supplierCache = [];
    protected array $unitCache = [];
    protected array $materialCache = [];
    protected array $workCache = [];

    /**
     * Import products and their BOMs from an uploaded file or file path.
     * Processes all sheets in the workbook (where each sheet represents a product).
     *
     * @param  \Illuminate\Http\UploadedFile|string  $file
     * @return array
     */
    public function import($file): array
    {
        $filePath = is_string($file) ? $file : $file->getRealPath();

        $reader = IOFactory::createReaderForFile($filePath);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($filePath);

        $results = [
            'created'  => 0,
            'updated'  => 0,
            'skipped'  => 0,
            'products' => [],
        ];

        DB::transaction(function () use ($spreadsheet, &$results) {
            foreach ($spreadsheet->getAllSheets() as $worksheet) {
                $this->processWorksheet($worksheet, $results);
            }
        });

        // Disconnect spreadsheet to free memory
        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);

        return $results;
    }

    /**
     * Fallback for Maatwebsite Excel ToCollection
     */
    public function collection(Collection $rows)
    {
        // Handled directly via import() for multi-sheet workbook support.
    }

    /**
     * Process an individual worksheet representing a Product and its BOM.
     */
    protected function processWorksheet(Worksheet $worksheet, array &$results): void
    {
        $highestRow = $worksheet->getHighestRow();
        if ($highestRow < 2) {
            $results['skipped']++;
            return;
        }

        // Convert worksheet rows to array (raw cached values, fast and memory-friendly)
        $rows = $worksheet->toArray(null, false, false, false);

        // 1. Determine Product Name
        // In the template, cell B2 contains the full Product Name.
        $cellB2 = isset($rows[1][1]) ? trim((string) $this->extractCellValue($rows[1][1])) : '';
        
        $sheetTitle = trim($worksheet->getTitle());
        // Clean sheet title (e.g., "1. T-Shirt Combed Premium - Sab" -> "T-Shirt Combed Premium - Sab")
        $cleanTitle = preg_replace('/^\d+[\.\s]*/', '', $sheetTitle);

        $productName = !empty($cellB2) ? $cellB2 : $cleanTitle;

        if (empty($productName)) {
            $results['skipped']++;
            return;
        }

        // 2. Scan rows for BOM sections (Bahan Utama, Aksesoris, Manufaktur)
        $materials = [];
        $works = [];
        $currentSection = null; // 'bahan', 'aksesoris', 'manufaktur'
        $headerIndices = [];

        foreach ($rows as $rowIndex => $row) {
            // Check row text
            $colA = isset($row[0]) ? strtoupper(trim((string) $this->extractCellValue($row[0]))) : '';
            $colB = isset($row[1]) ? strtoupper(trim((string) $this->extractCellValue($row[1]))) : '';
            $rowCombined = $colA . ' ' . $colB;

            // Detect section headers
            if (str_contains($rowCombined, 'BAHAN UTAMA') || $colA === 'BAHAN UTAMA' || $colB === 'BAHAN UTAMA') {
                $currentSection = 'bahan';
                $headerIndices = [];
                continue;
            }

            if (str_contains($rowCombined, 'AKSESORIS') || $colA === 'AKSESORIS' || $colB === 'AKSESORIS') {
                $currentSection = 'aksesoris';
                $headerIndices = [];
                continue;
            }

            if (str_contains($rowCombined, 'MANUFAKTUR') || str_contains($rowCombined, 'PEKERJA') || $colA === 'MANUFAKTUR' || $colB === 'MANUFAKTUR') {
                $currentSection = 'manufaktur';
                $headerIndices = [];
                continue;
            }

            if (!$currentSection) {
                continue;
            }

            // Check if this row is the column header row for the current section
            if (empty($headerIndices)) {
                $isHeaderRow = false;
                foreach ($row as $cIdx => $cell) {
                    $cellText = strtoupper(trim((string) $this->extractCellValue($cell)));
                    if (in_array($cellText, ['BAHAN', 'WORK', 'PEKERJAAN', 'PEMAKAIAN', 'WARNA', 'UNIT', 'VENDOR'])) {
                        $isHeaderRow = true;
                        break;
                    }
                }

                if ($isHeaderRow) {
                    foreach ($row as $cIdx => $cell) {
                        $cellText = strtoupper(trim((string) $this->extractCellValue($cell)));
                        if (($currentSection === 'manufaktur' && in_array($cellText, ['WORK', 'PEKERJAAN', 'PROSES'])) ||
                            ($currentSection !== 'manufaktur' && in_array($cellText, ['BAHAN', 'NAMA BAHAN']))) {
                            $headerIndices['name'] = $cIdx;
                        } elseif ($cellText === 'WARNA') {
                            $headerIndices['color'] = $cIdx;
                        } elseif (str_contains($cellText, 'PEMAKAIAN') && !str_contains($cellText, 'KET')) {
                            $headerIndices['usage'] = $cIdx;
                        } elseif (in_array($cellText, ['UNIT', 'SATUAN'])) {
                            $headerIndices['unit'] = $cIdx;
                        } elseif (str_contains($cellText, 'KET')) {
                            $headerIndices['notes'] = $cIdx;
                        } elseif (in_array($cellText, ['VENDOR', 'SUPPLIER'])) {
                            $headerIndices['vendor'] = $cIdx;
                        } elseif (str_contains($cellText, 'ECER')) {
                            $headerIndices['harga_ecer'] = $cIdx;
                        } elseif (str_contains($cellText, 'ROLL')) {
                            $headerIndices['harga_roll'] = $cIdx;
                        } elseif (str_contains($cellText, 'MIN') || str_contains($cellText, 'ESTIMASI')) {
                            $headerIndices['min_estimate'] = $cIdx;
                        } elseif (str_contains($cellText, 'MAX')) {
                            $headerIndices['max_estimate'] = $cIdx;
                        }
                    }

                    // Default fallbacks if specific columns were not matched
                    if (!isset($headerIndices['name'])) $headerIndices['name'] = 1; // Col B
                    if (!isset($headerIndices['color'])) $headerIndices['color'] = 2; // Col C
                    if (!isset($headerIndices['usage'])) $headerIndices['usage'] = 3; // Col D
                    if (!isset($headerIndices['unit'])) $headerIndices['unit'] = 4; // Col E
                    if (!isset($headerIndices['notes'])) $headerIndices['notes'] = 5; // Col F
                    if (!isset($headerIndices['vendor'])) $headerIndices['vendor'] = 6; // Col G
                    if (!isset($headerIndices['harga_ecer'])) $headerIndices['harga_ecer'] = 7; // Col H
                    if (!isset($headerIndices['harga_roll'])) $headerIndices['harga_roll'] = 8; // Col I
                    if (!isset($headerIndices['min_estimate'])) $headerIndices['min_estimate'] = 7; // Col H
                    continue;
                }
            }

            // Parse data row
            $nameIdx = $headerIndices['name'] ?? 1;
            $itemName = isset($row[$nameIdx]) ? trim((string) $this->extractCellValue($row[$nameIdx])) : '';

            // Ignore empty rows or summary/header text
            if (empty($itemName) || in_array(strtoupper($itemName), ['BAHAN', 'WORK', 'TOTAL', 'SUBTOTAL', 'NO', 'TOTAL HARGA/PCS', 'TOTAL BIAYA PER PCS'])) {
                continue;
            }

            if ($currentSection === 'bahan' || $currentSection === 'aksesoris') {
                $materials[] = [
                    'section'    => $currentSection,
                    'name'       => $itemName,
                    'color'      => isset($headerIndices['color']) && isset($row[$headerIndices['color']]) ? trim((string) $this->extractCellValue($row[$headerIndices['color']])) : '',
                    'usage'      => $this->parseNumber($row[$headerIndices['usage'] ?? 3] ?? 0),
                    'unit'       => isset($headerIndices['unit']) && isset($row[$headerIndices['unit']]) ? trim((string) $this->extractCellValue($row[$headerIndices['unit']])) : '',
                    'notes'      => isset($headerIndices['notes']) && isset($row[$headerIndices['notes']]) ? trim((string) $this->extractCellValue($row[$headerIndices['notes']])) : '',
                    'vendor'     => isset($headerIndices['vendor']) && isset($row[$headerIndices['vendor']]) ? trim((string) $this->extractCellValue($row[$headerIndices['vendor']])) : '',
                    'harga_ecer' => $this->parseNumber($row[$headerIndices['harga_ecer'] ?? 7] ?? 0),
                    'harga_roll' => $this->parseNumber($row[$headerIndices['harga_roll'] ?? 8] ?? 0),
                ];
            } elseif ($currentSection === 'manufaktur') {
                $usageVal = $this->parseNumber($row[$headerIndices['usage'] ?? 3] ?? 1);
                $minEst = $this->parseNumber($row[$headerIndices['min_estimate'] ?? 7] ?? 0);
                $maxEst = isset($headerIndices['max_estimate']) && isset($row[$headerIndices['max_estimate']])
                    ? $this->parseNumber($row[$headerIndices['max_estimate']])
                    : $minEst;

                $works[] = [
                    'name'         => $itemName,
                    'usage'        => $usageVal > 0 ? $usageVal : 1,
                    'unit'         => isset($headerIndices['unit']) && !empty($row[$headerIndices['unit']]) ? trim((string) $this->extractCellValue($row[$headerIndices['unit']])) : 'Pcs',
                    'notes'        => isset($headerIndices['notes']) && isset($row[$headerIndices['notes']]) ? trim((string) $this->extractCellValue($row[$headerIndices['notes']])) : '',
                    'vendor'       => isset($headerIndices['vendor']) && isset($row[$headerIndices['vendor']]) ? trim((string) $this->extractCellValue($row[$headerIndices['vendor']])) : '',
                    'min_estimate' => $minEst,
                    'max_estimate' => $maxEst > 0 ? $maxEst : $minEst,
                ];
            }
        }

        // 3. Prevent duplicate products: Update existing or create new
        $existingProduct = Product::whereRaw('LOWER(TRIM(name)) = ?', [strtolower($productName)])->first();

        if ($existingProduct) {
            $product = $existingProduct;
            $product->update([
                'is_active' => true,
            ]);
            // Clear old BOM relations to replace with fresh data from sheet
            $product->productMaterials()->delete();
            $product->productManufacturingWorks()->delete();
            $results['updated']++;
        } else {
            $product = Product::create([
                'name'                 => $productName,
                'product_category_id'  => null,
                'category'             => null,
                'description'          => 'Imported from Master Data',
                'is_active'            => true,
                'is_pattern_available' => false,
            ]);
            $results['created']++;
        }

        $results['products'][] = $product->name;

        // 4. Save Product Materials (Bahan Utama & Aksesoris)
        $materialSort = 1;
        foreach ($materials as $item) {
            $supplierId = $this->resolveSupplier($item['vendor'], $item['section']);
            $unit = $this->resolveUnit($item['unit']);
            $material = $this->resolveMaterial(
                $item['name'],
                $item['section'],
                $unit,
                $item['color'],
                $supplierId,
                $item['harga_ecer'],
                $item['harga_roll'],
                $item['usage'],
                $item['notes']
            );

            $product->productMaterials()->create([
                'material_id'         => $material->id,
                'default_supplier_id' => $supplierId,
                'harga_ecer'          => $item['harga_ecer'],
                'harga_roll'          => $item['harga_roll'],
                'type'                => $item['section'],
                'default_usage'       => $item['usage'],
                'default_unit'        => $unit ?: $material->unit,
                'default_color'       => !empty($item['color']) ? $item['color'] : $material->default_color,
                'sort_order'          => $materialSort++,
                'is_required'         => true,
                'notes'               => !empty($item['notes']) ? $item['notes'] : $material->description,
            ]);
        }

        // 5. Save Product Manufacturing Works
        $workSort = 1;
        foreach ($works as $item) {
            $supplierId = $this->resolveSupplier($item['vendor'], 'manufaktur');
            $unit = $this->resolveUnit($item['unit']);
            $work = $this->resolveWork(
                $item['name'],
                $unit,
                $supplierId,
                $item['min_estimate'],
                $item['max_estimate']
            );

            $product->productManufacturingWorks()->create([
                'manufacturing_work_id' => $work->id,
                'default_supplier_id'   => $supplierId,
                'default_usage'         => $item['usage'],
                'default_unit'          => $unit ?: $work->default_unit,
                'min_estimate'          => $item['min_estimate'],
                'max_estimate'          => $item['max_estimate'],
                'usage_note'            => !empty($item['notes']) ? $item['notes'] : null,
                'sort_order'            => $workSort++,
                'is_required'           => true,
            ]);
        }
    }

    /**
     * Resolve or create Supplier/Vendor based on vendor name and section.
     */
    protected function resolveSupplier(?string $vendorName, string $section): ?int
    {
        if (empty($vendorName) || trim($vendorName) === '-' || trim($vendorName) === '') {
            return null;
        }

        $cleaned = trim($vendorName);
        $key = strtolower($cleaned);

        if (isset($this->supplierCache[$key])) {
            return $this->supplierCache[$key];
        }

        $supplier = Supplier::whereRaw('LOWER(TRIM(nama)) = ?', [$key])
            ->orWhereRaw('LOWER(TRIM(nama_perusahaan)) = ?', [$key])
            ->first();

        if (!$supplier) {
            $categoryMap = [
                'bahan'      => 'Bahan Baku',
                'aksesoris'  => 'Aksesoris',
                'manufaktur' => 'CMT / Makloon',
            ];

            $supplier = Supplier::create([
                'nama'            => $cleaned,
                'nama_perusahaan' => $cleaned,
                'kategori'        => $categoryMap[$section] ?? 'Bahan Baku',
            ]);
        }

        $this->supplierCache[$key] = $supplier->id;
        return $supplier->id;
    }

    /**
     * Resolve or create Unit in default_size_breakdowns.
     */
    protected function resolveUnit(?string $unit): ?string
    {
        if (empty($unit) || trim($unit) === '-' || trim($unit) === '') {
            return null;
        }

        $cleaned = trim($unit);
        $key = strtolower($cleaned);

        if (isset($this->unitCache[$key])) {
            return $this->unitCache[$key];
        }

        $existing = DefaultSizeBreakdown::where('type', 'unit')
            ->whereRaw('LOWER(TRIM(label)) = ?', [$key])
            ->first();

        if (!$existing) {
            $maxSeq = DefaultSizeBreakdown::where('type', 'unit')->max('sequence') ?? 0;
            DefaultSizeBreakdown::create([
                'type'     => 'unit',
                'label'    => $cleaned,
                'sequence' => $maxSeq + 1,
            ]);
        }

        $this->unitCache[$key] = $cleaned;
        return $cleaned;
    }

    /**
     * Resolve or create Master Material in materials table.
     */
    protected function resolveMaterial(
        string $name,
        string $category,
        ?string $unit,
        ?string $color,
        ?int $supplierId,
        float $hargaEcer,
        float $hargaRoll,
        float $usage,
        ?string $notes
    ): Material {
        $key = strtolower(trim($name)) . '|' . $category;

        if (isset($this->materialCache[$key])) {
            return $this->materialCache[$key];
        }

        $material = Material::whereRaw('LOWER(TRIM(name)) = ?', [strtolower(trim($name))])
            ->where('category', $category)
            ->first();

        if (!$material) {
            $material = Material::create([
                'name'               => trim($name),
                'category'           => $category,
                'unit'               => $unit ?: null,
                'default_color'      => !empty($color) ? trim($color) : null,
                'default_vendor_id'  => $supplierId,
                'default_harga_ecer' => $hargaEcer > 0 ? (int) round($hargaEcer) : 0,
                'default_harga_roll' => $hargaRoll > 0 ? (int) round($hargaRoll) : 0,
                'default_usage'      => $usage,
                'description'        => !empty($notes) ? trim($notes) : null,
                'is_active'          => true,
            ]);
        } else {
            // Update missing fields if existing record has null/empty values
            $updates = [];
            if (empty($material->default_vendor_id) && $supplierId) {
                $updates['default_vendor_id'] = $supplierId;
            }
            if (empty($material->unit) && $unit) {
                $updates['unit'] = $unit;
            }
            if (empty($material->default_color) && !empty($color)) {
                $updates['default_color'] = trim($color);
            }
            if (($material->default_harga_ecer == 0 || $material->default_harga_ecer === null) && $hargaEcer > 0) {
                $updates['default_harga_ecer'] = (int) round($hargaEcer);
            }
            if (($material->default_harga_roll == 0 || $material->default_harga_roll === null) && $hargaRoll > 0) {
                $updates['default_harga_roll'] = (int) round($hargaRoll);
            }
            if (!empty($updates)) {
                $material->update($updates);
            }
        }

        $this->materialCache[$key] = $material;
        return $material;
    }

    /**
     * Resolve or create ManufacturingWork in manufacturing_works table.
     */
    protected function resolveWork(
        string $name,
        ?string $unit,
        ?int $supplierId,
        float $minEstimate,
        float $maxEstimate
    ): ManufacturingWork {
        $key = strtolower(trim($name));

        if (isset($this->workCache[$key])) {
            return $this->workCache[$key];
        }

        $work = ManufacturingWork::whereRaw('LOWER(TRIM(name)) = ?', [$key])->first();

        if (!$work) {
            $work = ManufacturingWork::create([
                'name'                 => trim($name),
                'default_unit'         => $unit ?: 'Pcs',
                'process_behavior'     => 'production_process',
                'default_vendor_id'    => $supplierId,
                'default_min_estimate' => $minEstimate,
                'default_max_estimate' => $maxEstimate ?: $minEstimate,
                'is_active'            => true,
            ]);
        } else {
            $updates = [];
            if (empty($work->default_vendor_id) && $supplierId) {
                $updates['default_vendor_id'] = $supplierId;
            }
            if (empty($work->default_unit) && $unit) {
                $updates['default_unit'] = $unit;
            }
            if (($work->default_min_estimate == 0 || $work->default_min_estimate === null) && $minEstimate > 0) {
                $updates['default_min_estimate'] = $minEstimate;
                $updates['default_max_estimate'] = $maxEstimate ?: $minEstimate;
            }
            if (!empty($updates)) {
                $work->update($updates);
            }
        }

        $this->workCache[$key] = $work;
        return $work;
    }

    /**
     * Safely extract string from cell value (handling RichText or objects).
     */
    protected function extractCellValue($cell): string
    {
        if ($cell instanceof RichText) {
            return $cell->getPlainText();
        }
        return (string) $cell;
    }

    /**
     * Clean and parse currency/usage numbers from Excel strings.
     * Handles formats like "Rp39,951", "Rp. 135.000", "0,29", "0.01", etc.
     */
    protected function parseNumber($val): float
    {
        if (is_numeric($val)) {
            return (float) $val;
        }

        if (empty($val)) {
            return 0.0;
        }

        $val = $this->extractCellValue($val);

        // Remove non-numeric characters except digits, dot, comma, minus
        $cleaned = preg_replace('/[^\d.,-]/', '', $val);
        if (empty($cleaned) || $cleaned === '-') {
            return 0.0;
        }

        // If both dot and comma exist (e.g. 1.234,56 or 1,234.56)
        if (strpos($cleaned, '.') !== false && strpos($cleaned, ',') !== false) {
            if (strrpos($cleaned, ',') > strrpos($cleaned, '.')) {
                // Indonesian format: 135.000,50
                $cleaned = str_replace('.', '', $cleaned);
                $cleaned = str_replace(',', '.', $cleaned);
            } else {
                // US format: 135,000.50
                $cleaned = str_replace(',', '', $cleaned);
            }
        } elseif (strpos($cleaned, ',') !== false) {
            // Only comma exists
            $parts = explode(',', $cleaned);
            // If comma is followed by exactly 3 digits and integer part is large, it's likely a thousands separator (e.g. 135,000)
            if (count($parts) === 2 && strlen($parts[1]) === 3 && (int) $parts[0] >= 10) {
                $cleaned = str_replace(',', '', $cleaned);
            } else {
                // Decimal separator (e.g. 0,29)
                $cleaned = str_replace(',', '.', $cleaned);
            }
        }

        return (float) $cleaned;
    }
}
