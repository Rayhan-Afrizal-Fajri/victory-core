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

use App\Models\ProductImportConflict;
use Illuminate\Support\Str;

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

        $batchId = (string) Str::uuid();

        $results = [
            'created'   => 0,
            'updated'   => 0,
            'skipped'   => 0,
            'batch_id'  => $batchId,
            'conflicts' => [],
            'products'  => [],
        ];

        DB::transaction(function () use ($spreadsheet, &$results, $batchId) {
            $sheetIndex = 0;
            foreach ($spreadsheet->getAllSheets() as $worksheet) {
                $sheetIndex++;
                $this->processWorksheet($worksheet, $results, $batchId, $sheetIndex);
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
    protected function processWorksheet(Worksheet $worksheet, array &$results, string $batchId, int $sheetIndex): void
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

            // Snapshot existing BOM data before clearing
            $oldMaterials = $product->productMaterials()->with('material', 'defaultSupplier')->get()->map(function ($pm) {
                return [
                    'id'                  => $pm->id,
                    'material_id'         => $pm->material_id,
                    'material_name'       => $pm->material?->name ?? '',
                    'type'                => $pm->type,
                    'default_supplier_id' => $pm->default_supplier_id,
                    'vendor_name'         => $pm->defaultSupplier?->nama ?? '',
                    'harga_ecer'          => (float) $pm->harga_ecer,
                    'harga_roll'          => (float) $pm->harga_roll,
                    'default_usage'       => (float) $pm->default_usage,
                    'default_unit'        => $pm->default_unit,
                    'default_color'       => $pm->default_color,
                    'sort_order'          => $pm->sort_order,
                    'is_required'         => $pm->is_required,
                    'notes'               => $pm->notes,
                ];
            })->values()->toArray();

            $oldWorks = $product->productManufacturingWorks()->with('manufacturingWork', 'defaultSupplier')->get()->map(function ($pw) {
                return [
                    'id'                    => $pw->id,
                    'manufacturing_work_id' => $pw->manufacturing_work_id,
                    'work_name'             => $pw->manufacturingWork?->name ?? '',
                    'default_supplier_id'   => $pw->default_supplier_id,
                    'vendor_name'           => $pw->defaultSupplier?->nama ?? '',
                    'default_usage'         => (float) $pw->default_usage,
                    'default_unit'          => $pw->default_unit,
                    'min_estimate'          => (float) $pw->min_estimate,
                    'max_estimate'          => (float) $pw->max_estimate,
                    'usage_note'            => $pw->usage_note,
                    'sort_order'            => $pw->sort_order,
                    'is_required'           => $pw->is_required,
                ];
            })->values()->toArray();

            $previousData = [
                'product' => [
                    'id'                   => $product->id,
                    'name'                 => $product->name,
                    'product_category_id'  => $product->product_category_id,
                    'category'             => $product->category,
                    'description'          => $product->description,
                    'is_active'            => $product->is_active,
                    'is_pattern_available' => $product->is_pattern_available,
                ],
                'materials' => $oldMaterials,
                'works'     => $oldWorks,
            ];

            $importedData = [
                'product_name' => $productName,
                'sheet_title'  => $sheetTitle,
                'sheet_index'  => $sheetIndex,
                'materials'    => $materials,
                'works'        => $works,
            ];

            // Build changes summary
            $changesSummary = $this->generateChangesSummary($oldMaterials, $materials, $oldWorks, $works);

            // Save conflict record
            $conflict = ProductImportConflict::create([
                'batch_id'            => $batchId,
                'sheet_index'         => $sheetIndex,
                'sheet_title'         => $sheetTitle,
                'product_name'        => $productName,
                'existing_product_id' => $product->id,
                'status'              => 'updated',
                'matched_fields'      => [
                    'field'       => 'name',
                    'value'       => $productName,
                    'sheet_title' => $sheetTitle,
                    'sheet_index' => $sheetIndex,
                ],
                'previous_data'       => $previousData,
                'imported_data'       => $importedData,
                'changes_summary'     => $changesSummary,
            ]);

            $results['conflicts'][] = $conflict->id;

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

        // 4. Save Product Materials & Manufacturing Works
        $this->attachBomToProduct($product, $materials, $works);
    }

    /**
     * Generate structured comparison summary of changes between previous BOM and newly imported BOM.
     */
    protected function generateChangesSummary(array $oldMaterials, array $newMaterials, array $oldWorks, array $newWorks): array
    {
        $oldMatNames = array_map(fn($m) => strtolower(trim($m['material_name'] ?? '')), $oldMaterials);
        $newMatNames = array_map(fn($m) => strtolower(trim($m['name'] ?? '')), $newMaterials);

        $addedMaterials = array_filter($newMaterials, fn($m) => !in_array(strtolower(trim($m['name'] ?? '')), $oldMatNames));
        $removedMaterials = array_filter($oldMaterials, fn($m) => !in_array(strtolower(trim($m['material_name'] ?? '')), $newMatNames));

        $oldWorkNames = array_map(fn($w) => strtolower(trim($w['work_name'] ?? '')), $oldWorks);
        $newWorkNames = array_map(fn($w) => strtolower(trim($w['name'] ?? '')), $newWorks);

        $addedWorks = array_filter($newWorks, fn($w) => !in_array(strtolower(trim($w['name'] ?? '')), $oldWorkNames));
        $removedWorks = array_filter($oldWorks, fn($w) => !in_array(strtolower(trim($w['work_name'] ?? '')), $newWorkNames));

        return [
            'old_materials_count' => count($oldMaterials),
            'new_materials_count' => count($newMaterials),
            'old_works_count'     => count($oldWorks),
            'new_works_count'     => count($newWorks),
            'added_materials'     => array_values(array_map(fn($m) => $m['name'], $addedMaterials)),
            'removed_materials'   => array_values(array_map(fn($m) => $m['material_name'], $removedMaterials)),
            'added_works'         => array_values(array_map(fn($w) => $w['name'], $addedWorks)),
            'removed_works'       => array_values(array_map(fn($w) => $w['work_name'], $removedWorks)),
        ];
    }

    /**
     * Attach BOM (Materials and Manufacturing Works) to a product.
     */
    public function attachBomToProduct(Product $product, array $materials, array $works): void
    {
        // 1. Save Product Materials (Bahan Utama & Aksesoris)
        $materialSort = 1;
        foreach ($materials as $item) {
            $supplierId = $this->resolveSupplier($item['vendor'] ?? null, $item['section'] ?? 'bahan');
            $unit = $this->resolveUnit($item['unit'] ?? null);
            $material = $this->resolveMaterial(
                $item['name'],
                $item['section'] ?? 'bahan',
                $unit,
                $item['color'] ?? null,
                $supplierId,
                $item['harga_ecer'] ?? 0,
                $item['harga_roll'] ?? 0,
                $item['usage'] ?? 0,
                $item['notes'] ?? null
            );

            $product->productMaterials()->create([
                'material_id'         => $material->id,
                'default_supplier_id' => $supplierId,
                'harga_ecer'          => $item['harga_ecer'] ?? 0,
                'harga_roll'          => $item['harga_roll'] ?? 0,
                'type'                => $item['section'] ?? 'bahan',
                'default_usage'       => $item['usage'] ?? 0,
                'default_unit'        => $unit ?: $material->unit,
                'default_color'       => !empty($item['color']) ? $item['color'] : $material->default_color,
                'sort_order'          => $materialSort++,
                'is_required'         => true,
                'notes'               => !empty($item['notes']) ? $item['notes'] : $material->description,
            ]);
        }

        // 2. Save Product Manufacturing Works
        $workSort = 1;
        foreach ($works as $item) {
            $supplierId = $this->resolveSupplier($item['vendor'] ?? null, 'manufaktur');
            $unit = $this->resolveUnit($item['unit'] ?? null);
            $work = $this->resolveWork(
                $item['name'],
                $unit,
                $supplierId,
                $item['min_estimate'] ?? 0,
                $item['max_estimate'] ?? 0
            );

            $product->productManufacturingWorks()->create([
                'manufacturing_work_id' => $work->id,
                'default_supplier_id'   => $supplierId,
                'default_usage'         => $item['usage'] ?? 1,
                'default_unit'          => $unit ?: $work->default_unit,
                'min_estimate'          => $item['min_estimate'] ?? 0,
                'max_estimate'          => $item['max_estimate'] ?? 0,
                'usage_note'            => !empty($item['notes']) ? $item['notes'] : null,
                'sort_order'            => $workSort++,
                'is_required'           => true,
            ]);
        }
    }

    /**
     * Restore previous BOM snapshot back to a Product.
     */
    public function restoreBomFromSnapshot(Product $product, array $previousMaterials, array $previousWorks): void
    {
        $product->productMaterials()->delete();
        $product->productManufacturingWorks()->delete();

        $matSort = 1;
        foreach ($previousMaterials as $item) {
            $product->productMaterials()->create([
                'material_id'         => $item['material_id'],
                'default_supplier_id' => $item['default_supplier_id'] ?? null,
                'harga_ecer'          => $item['harga_ecer'] ?? 0,
                'harga_roll'          => $item['harga_roll'] ?? 0,
                'type'                => $item['type'] ?? 'bahan',
                'default_usage'       => $item['default_usage'] ?? 0,
                'default_unit'        => $item['default_unit'] ?? null,
                'default_color'       => $item['default_color'] ?? null,
                'sort_order'          => $item['sort_order'] ?? $matSort++,
                'is_required'         => $item['is_required'] ?? true,
                'notes'               => $item['notes'] ?? null,
            ]);
        }

        $workSort = 1;
        foreach ($previousWorks as $item) {
            $product->productManufacturingWorks()->create([
                'manufacturing_work_id' => $item['manufacturing_work_id'],
                'default_supplier_id'   => $item['default_supplier_id'] ?? null,
                'default_usage'         => $item['default_usage'] ?? 1,
                'default_unit'          => $item['default_unit'] ?? 'Pcs',
                'min_estimate'          => $item['min_estimate'] ?? 0,
                'max_estimate'          => $item['max_estimate'] ?? 0,
                'usage_note'            => $item['usage_note'] ?? null,
                'sort_order'            => $item['sort_order'] ?? $workSort++,
                'is_required'           => $item['is_required'] ?? true,
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
