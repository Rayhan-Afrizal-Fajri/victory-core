<?php

namespace App\Imports;

use App\Models\ManufacturingWork;
use App\Models\Material;
use App\Models\ProductCategory;
use App\Models\ProductCategoryManufacturingWork;
use App\Models\ProductCategoryMaterial;
use App\Models\Supplier;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductCategoryImport implements ToCollection, WithHeadingRow
{
    protected Collection $materials;
    protected Collection $manufacturingWorks;
    protected Collection $suppliers;

    public function __construct()
    {
        $this->materials = Material::with('defaultVendor')->get();
        $this->manufacturingWorks = ManufacturingWork::all();
        $this->suppliers = Supplier::all();
    }

    /**
     * @param Collection $rows
     */
    public function collection(Collection $rows)
    {
        DB::transaction(function () use ($rows) {
            foreach ($rows as $row) {
                $name = trim($row['name'] ?? $row['nama'] ?? '');
                if (empty($name)) {
                    continue;
                }

                $category = ProductCategory::firstOrCreate([
                    'name' => $name,
                ]);

                // 1. Process Bahan
                $bahanItems = $this->parseItems($row['bahan'] ?? '');
                $bahanIds = [];
                foreach ($bahanItems as $itemStr) {
                    $material = $this->findOrCreateMaterial($itemStr, 'bahan');
                    if ($material) {
                        $bahanIds[] = $material->id;
                    }
                }

                // 2. Process Aksesoris
                $aksesorisItems = $this->parseItems($row['aksesoris'] ?? '');
                $aksesorisIds = [];
                foreach ($aksesorisItems as $itemStr) {
                    $material = $this->findOrCreateMaterial($itemStr, 'aksesoris');
                    if ($material) {
                        $aksesorisIds[] = $material->id;
                    }
                }

                // 3. Process Manufaktur
                $manufakturItems = $this->parseItems($row['manufaktur'] ?? '');
                $workIds = [];
                foreach ($manufakturItems as $itemStr) {
                    $work = $this->findOrCreateManufacturingWork($itemStr);
                    if ($work) {
                        $workIds[] = $work->id;
                    }
                }

                // Attach Materials (Bahan & Aksesoris)
                $allMaterialIds = array_unique(array_merge($bahanIds, $aksesorisIds));
                foreach ($allMaterialIds as $materialId) {
                    ProductCategoryMaterial::firstOrCreate([
                        'product_category_id' => $category->id,
                        'material_id' => $materialId,
                    ]);
                }

                // Attach Manufacturing Works
                $uniqueWorkIds = array_unique($workIds);
                foreach ($uniqueWorkIds as $workId) {
                    ProductCategoryManufacturingWork::firstOrCreate([
                        'product_category_id' => $category->id,
                        'manufacturing_work_id' => $workId,
                    ]);
                }
            }
        });
    }

    /**
     * Parse comma/semicolon/newline separated string into an array of trimmed items.
     */
    protected function parseItems(?string $str): array
    {
        if (empty($str)) {
            return [];
        }

        $parts = preg_split('/[,;\n]+/', (string) $str);
        return array_values(array_filter(array_map('trim', $parts), fn($val) => $val !== ''));
    }

    /**
     * Parse material string to separate material name and vendor (e.g. "American Drill - Intan Textile")
     */
    protected function parseItemAndVendor(string $itemString): array
    {
        if (str_contains($itemString, ' - ')) {
            $parts = array_map('trim', explode(' - ', $itemString, 2));
            return [$parts[0], $parts[1] ?? null];
        } elseif (str_contains($itemString, '-')) {
            $parts = array_map('trim', explode('-', $itemString, 2));
            return [$parts[0], $parts[1] ?? null];
        }

        return [trim($itemString), null];
    }

    /**
     * Smart search to find material, or create if not exists.
     */
    protected function findOrCreateMaterial(string $itemString, string $category): ?Material
    {
        [$materialName, $vendorName] = $this->parseItemAndVendor($itemString);
        if (empty($materialName)) {
            return null;
        }

        $bestMatch = null;
        $bestScore = 0;

        foreach ($this->materials as $candidate) {
            $score = $this->calculateMaterialScore($candidate, $materialName, $vendorName, $category, $itemString);
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $candidate;
            }
        }

        // Return best match if score passes confidence threshold
        if ($bestMatch && $bestScore >= 50) {
            return $bestMatch;
        }

        // If not found in master, create new Material
        $supplierId = null;
        if (!empty($vendorName)) {
            $supplier = $this->findOrCreateSupplier($vendorName);
            $supplierId = $supplier?->id;
        }

        $newMaterial = Material::create([
            'name' => $materialName,
            'category' => $category,
            'default_vendor_id' => $supplierId,
            'is_active' => true,
        ]);

        $this->materials->push($newMaterial);

        return $newMaterial;
    }

    /**
     * Calculate similarity score between candidate Material and search query.
     */
    protected function calculateMaterialScore(Material $candidate, string $queryName, ?string $queryVendor, string $expectedCategory, string $rawString): float
    {
        $score = 0;
        $cName = strtolower(trim($candidate->name));
        $qName = strtolower($queryName);
        $raw = strtolower($rawString);

        if ($cName === $qName || $cName === $raw) {
            $score += 100;
        } else {
            $minLen = min(strlen($cName), strlen($qName));
            $maxLen = max(strlen($cName), strlen($qName));
            $lenRatio = $maxLen > 0 ? ($minLen / $maxLen) : 0;

            if (str_contains($cName, $qName) || str_contains($qName, $cName)) {
                if ($lenRatio >= 0.7) {
                    $score += 70 * $lenRatio;
                } elseif ($lenRatio >= 0.5) {
                    $score += 40 * $lenRatio;
                } else {
                    $score += 15;
                }
            } else {
                similar_text($cName, $qName, $percent);
                $lev = levenshtein($cName, $qName);
                if ($percent >= 75 || ($lev <= 2 && strlen($qName) >= 4)) {
                    $score += ($percent * 0.7);
                }
            }
        }

        if ($score === 0) {
            return 0;
        }

        // Check Vendor match if query specifies vendor
        if (!empty($queryVendor)) {
            $qVendor = strtolower($queryVendor);
            $cVendor = strtolower(trim($candidate->defaultVendor?->nama_perusahaan ?? $candidate->defaultVendor?->nama ?? ''));
            if (!empty($cVendor)) {
                if ($cVendor === $qVendor) {
                    $score += 50;
                } elseif (str_contains($cVendor, $qVendor) || str_contains($qVendor, $cVendor)) {
                    $score += 35;
                } else {
                    similar_text($cVendor, $qVendor, $vPercent);
                    if ($vPercent >= 70) {
                        $score += 25;
                    } else {
                        // Penalty if vendor was explicitly specified but doesn't match candidate's vendor
                        $score -= 45;
                    }
                }
            }
        }

        // Priority boost for matching category
        if ($candidate->category === $expectedCategory) {
            $score += 15;
        }

        return max(0, $score);
    }

    /**
     * Smart search to find manufacturing work, or create if not exists.
     */
    protected function findOrCreateManufacturingWork(string $workString): ?ManufacturingWork
    {
        $wQuery = strtolower(trim($workString));
        if (empty($wQuery)) {
            return null;
        }

        $bestMatch = null;
        $bestScore = 0;

        foreach ($this->manufacturingWorks as $candidate) {
            $score = 0;
            $cName = strtolower(trim($candidate->name));

            if ($cName === $wQuery) {
                $score += 100;
            } elseif (str_contains($cName, $wQuery) || str_contains($wQuery, $cName)) {
                $score += 70;
            } else {
                similar_text($cName, $wQuery, $percent);
                $lev = levenshtein($cName, $wQuery);
                if ($percent >= 70 || ($lev <= 2 && strlen($wQuery) >= 3)) {
                    $score += $percent;
                }
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $candidate;
            }
        }

        if ($bestMatch && $bestScore >= 50) {
            return $bestMatch;
        }

        // If not found in master, create new ManufacturingWork
        $newWork = ManufacturingWork::create([
            'name' => trim($workString),
            'process_behavior' => 'production_process',
            'is_active' => true,
        ]);

        $this->manufacturingWorks->push($newWork);

        return $newWork;
    }

    /**
     * Find existing supplier by name, or create a new one.
     */
    protected function findOrCreateSupplier(string $vendorName): ?Supplier
    {
        $vQuery = strtolower(trim($vendorName));
        if (empty($vQuery)) {
            return null;
        }

        foreach ($this->suppliers as $s) {
            $sName = strtolower(trim($s->nama_perusahaan ?? $s->nama ?? ''));
            if ($sName === $vQuery || str_contains($sName, $vQuery) || str_contains($vQuery, $sName)) {
                return $s;
            }
            similar_text($sName, $vQuery, $percent);
            if ($percent >= 80) {
                return $s;
            }
        }

        $supplier = Supplier::create([
            'nama_perusahaan' => trim($vendorName),
            'nama' => trim($vendorName),
        ]);

        $this->suppliers->push($supplier);

        return $supplier;
    }
}
