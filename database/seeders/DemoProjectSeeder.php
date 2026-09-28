<?php

namespace Database\Seeders;

use App\Models\CompanyProfile;
use App\Models\Customer;
use App\Models\DefaultSizeBreakdown;
use App\Models\Design;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\JobTicket;
use App\Models\ManufacturingWork;
use App\Models\Material;
use App\Models\MaterialReceiving;
use App\Models\OrderSpecification;
use App\Models\Payment;
use App\Models\Pesanan;
use App\Models\PesananManufacturingSpecs;
use App\Models\PesananMaterialSpecs;
use App\Models\PesananSizeBreakdown;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductionDefectHistory;
use App\Models\ProductionProgress;
use App\Models\ProductionQcLog;
use App\Models\ProductionRun;
use App\Models\ProductionRunProcess;
use App\Models\ProductManufacturingWork;
use App\Models\ProductMaterial;
use App\Models\ProfitLoss;
use App\Models\Purchasing;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\QuotationItemSize;
use App\Models\QuotationNote;
use App\Models\Sample;
use App\Models\SampleDelivery;
use App\Models\Supplier;
use App\Models\User;
use App\Models\WorkflowHistory;
use App\Models\WorkflowStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoProjectSeeder extends Seeder
{
    private array $suppliers = [];

    private array $materials = [];

    private array $works = [];

    private array $products = [];

    private array $customers = [];

    private array $companies = [];

    private array $users = [];

    private array $stages = [
        'quotation', 'design', 'revision', 'sample',
        'purchasing', 'production', 'quality', 'delivery',
    ];

    public function run(): void
    {
        $this->call(RoleUserSeeder::class);

        DB::transaction(function (): void {
            $this->loadUsers();
            $this->seedCatalog();
            $this->seedProjects();
        });

        $this->command?->info('Demo data siap: 24 project pada 8 tahap workflow.');
    }

    private function loadUsers(): void
    {
        $this->users = User::whereIn('email', [
            'owner@victorylabs.id', 'admin@victorylabs.id', 'designer@victorylabs.id',
            'finance@victorylabs.id', 'purchasing@victorylabs.id', 'kepala_produksi@victorylabs.id',
        ])->get()->keyBy('email')->all();
    }

    private function seedCatalog(): void
    {
        $supplierData = [
            ['Knitto', 'Bahan Baku'], ['Fabriku', 'Bahan Baku'], ['Intan Textile', 'Bahan Baku'],
            ['Toko 1001', 'Aksesoris'], ['Max Print', 'Aksesoris'],
            ['Bordir Cimahi', 'CMT / Makloon'], ['Makloon Bandung', 'CMT / Makloon'],
            ['Mapan Plastik', 'Aksesoris'],
        ];
        foreach ($supplierData as $index => [$name, $category]) {
            $this->suppliers[$name] = Supplier::updateOrCreate(
                ['nama_perusahaan' => $name],
                [
                    'nama' => 'Kontak '.$name,
                    'email' => 'supplier'.($index + 1).'@demo.victorylabs.id',
                    'kategori' => $category,
                    'kontak' => '081200000'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'alamat' => 'Bandung, Jawa Barat',
                ]
            );
        }

        foreach ([
            ['PT Victory Labs Demo', 'non_pkp', 'BCA', 0],
            ['CV Victory Apparel Demo', 'pkp', 'Mandiri', 11],
            ['CV Victory Makmur Demo', 'pkp', 'BPD Jawa Barat', 11],
        ] as [$name, $type, $bank, $tax]) {
            $this->companies[] = CompanyProfile::updateOrCreate(
                ['company_name' => $name],
                [
                    'company_type' => $type,
                    'bank_type' => $bank,
                    'tax_percentage' => $tax,
                    'account_number' => '1234567890',
                    'account_name' => $name,
                    'address' => 'Bandung, Jawa Barat',
                    'swift_code' => 'CENAIDJA',
                ]
            );
        }

        $customerCompanies = [
            'PT Arunika Sport Indonesia', 'CV Langkah Juara', 'PT Bumi Rasa Nusantara',
            'Komunitas Runners Bandung', 'PT Cipta Medika Sejahtera', 'CV Karya Bahari',
            'PT Nusa Teknologi', 'Akademi Garuda Muda', 'PT Ritel Bersama',
            'CV Pangan Lestari', 'PT Cakrawala Logistik', 'Komunitas Sepeda Priangan',
        ];
        $customerNames = [
            'Rina Puspita', 'Dimas Pratama', 'Nadia Putri', 'Agus Setiawan',
            'Maya Kartika', 'Fajar Ramadhan', 'Intan Permata', 'Bima Saputra',
            'Salsa Maharani', 'Reza Firmansyah', 'Dewi Anggraini', 'Rangga Wijaya',
        ];
        foreach ($customerCompanies as $index => $company) {
            $this->customers[] = Customer::updateOrCreate(
                ['nama_perusahaan' => $company],
                [
                    'nama' => $customerNames[$index],
                    'jabatan' => 'Purchasing',
                    'no_hp' => '0813000'.str_pad((string) ($index + 1), 6, '0', STR_PAD_LEFT),
                    'provinsi' => 'Jawa Barat',
                    'kota' => 'Kota Bandung',
                    'kecamatan' => 'Coblong',
                    'kelurahan' => 'Dago',
                    'kode_pos' => '40135',
                    'alamat_detail' => 'Jl. Demo Industri No. '.($index + 1),
                ]
            );
        }

        $categoryNames = ['T-Shirt', 'Jersey', 'Polo', 'Jaket', 'Kemeja', 'Wearpack', 'Tote Bag', 'Apron'];
        $categories = [];
        foreach ($categoryNames as $name) {
            $categories[$name] = ProductCategory::firstOrCreate(['name' => $name]);
        }

        $materialData = [
            ['Kain Combed 24s', 'bahan', 'kg', 'Knitto', 125000, 118000, 0.24],
            ['Dryfit Micro', 'bahan', 'kg', 'Fabriku', 98000, 92000, 0.22],
            ['American Drill', 'bahan', 'meter', 'Intan Textile', 32000, 29000, 1.8],
            ['Kain Rib', 'bahan', 'kg', 'Knitto', 110000, 104000, 0.03],
            ['Benang Jahit', 'aksesoris', 'cone', 'Toko 1001', 18000, 16000, 0.03],
            ['Label Woven', 'aksesoris', 'pcs', 'Toko 1001', 350, 280, 1],
            ['Plastik OPP', 'aksesoris', 'pcs', 'Mapan Plastik', 450, 350, 1],
            ['Kancing', 'aksesoris', 'pcs', 'Toko 1001', 750, 600, 4],
            ['Zipper', 'aksesoris', 'pcs', 'Toko 1001', 4500, 4000, 1],
            ['Cat Sablon', 'aksesoris', 'kg', 'Max Print', 95000, 88000, 0.04],
            ['Transfer DTF', 'aksesoris', 'cm', 'Max Print', 400, 350, 30],
            ['Karet Pinggang', 'aksesoris', 'meter', 'Toko 1001', 8000, 7000, 0.8],
        ];
        foreach ($materialData as [$name, $type, $unit, $supplier, $retail, $roll, $usage]) {
            $this->materials[$name] = Material::updateOrCreate(
                ['name' => $name, 'category' => $type],
                [
                    'unit' => $unit,
                    'default_color' => 'Hitam',
                    'default_vendor_id' => $this->suppliers[$supplier]->id,
                    'default_harga_ecer' => $retail,
                    'default_harga_roll' => $roll,
                    'default_price_type' => 'ecer',
                    'default_usage' => $usage,
                    'description' => 'Master material untuk simulasi project demo.',
                    'is_active' => true,
                ]
            );
        }

        $workData = [
            ['Setting', 'costing_only', 'Makloon Bandung', 1500],
            ['Cutting', 'production_process', 'Makloon Bandung', 2200],
            ['Sablon', 'production_process', 'Max Print', 3500],
            ['Jahit', 'production_process', 'Makloon Bandung', 6500],
            ['Bordir', 'production_process', 'Bordir Cimahi', 4000],
            ['QC', 'costing_only', 'Makloon Bandung', 1200],
            ['Finishing', 'production_process', 'Makloon Bandung', 1800],
            ['Packing', 'costing_only', 'Makloon Bandung', 900],
        ];
        foreach ($workData as [$name, $behavior, $vendor, $estimate]) {
            $this->works[$name] = ManufacturingWork::updateOrCreate(
                ['name' => $name],
                [
                    'default_unit' => 'pcs',
                    'process_behavior' => $behavior,
                    'default_vendor_id' => $this->suppliers[$vendor]->id,
                    'default_min_estimate' => (int) ($estimate * 0.85),
                    'default_max_estimate' => $estimate,
                    'is_active' => true,
                ]
            );
        }

        $resources = [
            'T-Shirt' => [['Kain Combed 24s', 'Kain Rib', 'Benang Jahit', 'Label Woven', 'Plastik OPP', 'Cat Sablon', 'Transfer DTF'], ['Setting', 'Cutting', 'Sablon', 'Jahit', 'QC', 'Finishing', 'Packing']],
            'Jersey' => [['Dryfit Micro', 'Benang Jahit', 'Label Woven', 'Plastik OPP', 'Transfer DTF'], ['Setting', 'Cutting', 'Sablon', 'Jahit', 'QC', 'Finishing', 'Packing']],
            'Polo' => [['Kain Combed 24s', 'Kain Rib', 'Benang Jahit', 'Kancing', 'Label Woven', 'Plastik OPP'], ['Setting', 'Cutting', 'Bordir', 'Jahit', 'QC', 'Finishing', 'Packing']],
            'Jaket' => [['American Drill', 'Benang Jahit', 'Zipper', 'Label Woven', 'Plastik OPP'], ['Setting', 'Cutting', 'Sablon', 'Jahit', 'QC', 'Finishing', 'Packing']],
            'Kemeja' => [['American Drill', 'Benang Jahit', 'Kancing', 'Label Woven', 'Plastik OPP'], ['Setting', 'Cutting', 'Bordir', 'Jahit', 'QC', 'Finishing', 'Packing']],
            'Wearpack' => [['American Drill', 'Benang Jahit', 'Kancing', 'Zipper', 'Karet Pinggang', 'Label Woven'], ['Setting', 'Cutting', 'Bordir', 'Jahit', 'QC', 'Finishing', 'Packing']],
            'Tote Bag' => [['American Drill', 'Benang Jahit', 'Plastik OPP', 'Transfer DTF'], ['Setting', 'Cutting', 'Sablon', 'Jahit', 'QC', 'Finishing', 'Packing']],
            'Apron' => [['American Drill', 'Benang Jahit', 'Kancing', 'Karet Pinggang', 'Label Woven'], ['Setting', 'Cutting', 'Bordir', 'Jahit', 'QC', 'Finishing', 'Packing']],
        ];
        foreach ($resources as $categoryName => [$materialNames, $workNames]) {
            foreach ($materialNames as $materialName) {
                DB::table('product_category_materials')->updateOrInsert(
                    ['product_category_id' => $categories[$categoryName]->id, 'material_id' => $this->materials[$materialName]->id],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
            foreach ($workNames as $workName) {
                DB::table('category_manufacturing_works')->updateOrInsert(
                    ['product_category_id' => $categories[$categoryName]->id, 'manufacturing_work_id' => $this->works[$workName]->id],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }

            $product = Product::updateOrCreate(
                ['name' => 'Demo '.$categoryName],
                [
                    'product_category_id' => $categories[$categoryName]->id,
                    'description' => 'Artikel katalog untuk simulasi '.$categoryName.'.',
                    'is_active' => true,
                    'is_pattern_available' => true,
                ]
            );
            $this->products[] = $product;

            foreach ($materialNames as $position => $materialName) {
                $material = $this->materials[$materialName];
                ProductMaterial::updateOrCreate(
                    ['product_id' => $product->id, 'material_id' => $material->id],
                    [
                        'default_supplier_id' => $material->default_vendor_id,
                        'harga_ecer' => $material->default_harga_ecer,
                        'harga_roll' => $material->default_harga_roll,
                        'type' => $material->category,
                        'default_usage' => $material->default_usage,
                        'default_unit' => $material->unit,
                        'default_color' => 'Hitam',
                        'sort_order' => $position + 1,
                        'is_required' => true,
                        'notes' => 'Kebutuhan standar artikel demo.',
                    ]
                );
            }
            foreach ($workNames as $position => $workName) {
                $work = $this->works[$workName];
                ProductManufacturingWork::updateOrCreate(
                    ['product_id' => $product->id, 'manufacturing_work_id' => $work->id],
                    [
                        'default_supplier_id' => $work->default_vendor_id,
                        'default_usage' => 1,
                        'default_unit' => 'pcs',
                        'min_estimate' => $work->default_min_estimate,
                        'max_estimate' => $work->default_max_estimate,
                        'usage_note' => 'Estimasi biaya per potong.',
                        'sort_order' => $position + 1,
                        'is_required' => true,
                    ]
                );
            }
        }

        foreach ([
            'color' => ['Hitam', 'Navy', 'Putih', 'Merah', 'Royal Blue'],
            'fabric' => ['Combed 24s', 'Combed 30s', 'Dryfit Micro', 'American Drill'],
            'size' => ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'],
            'unit' => ['pcs', 'kg', 'meter', 'cone'],
        ] as $type => $labels) {
            foreach ($labels as $sequence => $label) {
                DefaultSizeBreakdown::updateOrCreate(
                    ['type' => $type, 'label' => $label],
                    ['sequence' => $sequence + 1]
                );
            }
        }
    }

    private function seedProjects(): void
    {
        foreach (range(1, 24) as $number) {
            $stage = $this->stages[($number - 1) % count($this->stages)];
            $stageIndex = array_search($stage, $this->stages, true);
            $customer = $this->customers[($number - 1) % count($this->customers)];
            $company = $this->companies[($number - 1) % count($this->companies)];
            $product = $this->products[($number - 1) % count($this->products)];
            $quantity = 120 + (($number - 1) * 15);
            $date = now()->subDays(35 - $number)->startOfDay();
            $deadline = now()->addDays(14 + $number)->toDateString();
            $ticketNumber = 'DEMO-2026-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT);

            $ticket = JobTicket::updateOrCreate(
                ['no_job_ticket' => $ticketNumber],
                [
                    'date' => $date->toDateString(),
                    'customer_id' => $customer->id,
                    'customer_nama_snapshot' => $customer->nama,
                    'customer_perusahaan_snapshot' => $customer->nama_perusahaan,
                    'company_profile_id' => $company->id,
                    'sales_name' => ['Salman', 'Faris', 'Rudi', 'Andi'][($number - 1) % 4],
                    'deadline' => $deadline,
                    'customer_notes' => 'Simulasi project '.$ticketNumber.' untuk '.$product->name.'.',
                    'status' => $this->ticketStatus($stage),
                    'created_by' => $this->users['admin@victorylabs.id']->id,
                ]
            );
            $order = Pesanan::updateOrCreate(
                ['job_ticket_id' => $ticket->id],
                [
                    'product_id' => $product->id,
                    'produk' => $product->name,
                    'requested_product_name' => $product->name,
                    'q' => $quantity,
                    'qs' => 2,
                    'sample_qty' => 2,
                    'deadline' => $deadline,
                    'harga_jual_per_pcs' => 85000 + (($number % 4) * 7500),
                    'harga_sample_per_pcs' => 125000,
                    'estimasi_hpp_per_pcs' => 52000 + (($number % 5) * 2500),
                    'keterangan_tambahan' => 'Logo bordir dada kiri dan branding bagian belakang.',
                ]
            );

            $this->seedOrderDetails($order, $product, $quantity);
            $this->seedQuotation($ticket, $order, $product, $quantity, $ticketNumber, $stage);
            $this->seedDesign($order, $ticketNumber, $stage);
            $this->seedWorkflow($order, $ticket, $stage, $stageIndex);

            if ($stageIndex >= 3) {
                $sample = $this->seedSample($order, $quantity, $ticketNumber, $stageIndex);
                $sampleInvoice = $this->seedInvoice(
                    $ticket, $order, $sample->qty, $sample->sample_price, 'SAMPLE', $ticketNumber,
                    $stageIndex >= 4 ? 'paid' : 'unpaid', $stageIndex >= 4
                );
                $sample->update(['invoice_id' => $sampleInvoice->id]);
            }
            if ($stageIndex >= 4) {
                $this->seedPurchasing($order, $stageIndex);
            }
            if ($stageIndex >= 5) {
                $this->seedProduction($ticket, $order, $quantity, $ticketNumber, $stageIndex);
                $productionInvoice = $this->seedInvoice(
                    $ticket, $order, $quantity, $order->harga_jual_per_pcs, 'PRODUCTION', $ticketNumber,
                    $stageIndex === 7 ? 'paid' : ($stageIndex === 5 ? 'partially_paid' : 'unpaid'),
                    $stageIndex === 7
                );
                if ($stageIndex === 5 || $stageIndex === 7) {
                    $amount = $stageIndex === 7 ? $productionInvoice->total_tagihan : $productionInvoice->total_tagihan * 0.5;
                    $this->seedPayment($productionInvoice, $amount, $stageIndex === 7);
                }
            }
            if ($stageIndex >= 4) {
                $this->seedProfitAndProgress($order, $quantity, $stageIndex);
            }
        }
    }

    private function seedOrderDetails(Pesanan $order, Product $product, int $quantity): void
    {
        foreach ($product->productMaterials()->with('material')->get() as $productMaterial) {
            $material = $productMaterial->material;
            $usage = (float) $productMaterial->default_usage;
            $unitPrice = (float) $productMaterial->harga_ecer;
            $totalUsage = $usage * $quantity;
            $cost = $totalUsage * $unitPrice;
            PesananMaterialSpecs::updateOrCreate(
                ['pesanan_id' => $order->id, 'material_id' => $material->id],
                [
                    'product_id' => $product->id,
                    'supplier_id' => $productMaterial->default_supplier_id,
                    'type' => $material->category,
                    'material_name_snapshot' => $material->name,
                    'color' => 'Navy',
                    'usage' => $usage,
                    'unit' => $material->unit,
                    'usage_per_set' => 1,
                    'harga_ecer' => $unitPrice,
                    'harga_roll' => $productMaterial->harga_roll,
                    'price_type' => 'ecer',
                    'total_usage' => $totalUsage,
                    'total_cost' => $cost,
                    'cost_per_pcs' => $cost / $quantity,
                ]
            );
        }
        foreach ($product->productManufacturingWorks()->with('manufacturingWork')->get() as $position => $productWork) {
            $work = $productWork->manufacturingWork;
            PesananManufacturingSpecs::updateOrCreate(
                ['pesanan_id' => $order->id, 'manufacturing_work_id' => $work->id],
                [
                    'product_id' => $product->id,
                    'vendor_id' => $productWork->default_supplier_id,
                    'work_name_snapshot' => $work->name,
                    'usage' => 1,
                    'unit' => 'pcs',
                    'usage_note' => 'Biaya proses per potong.',
                    'process_behavior' => $work->process_behavior,
                    'min_estimate' => $productWork->min_estimate,
                    'max_estimate' => $productWork->max_estimate,
                    'sort_order' => $position + 1,
                    'cost_per_pcs' => $productWork->max_estimate,
                ]
            );
        }
        foreach ([
            ['logo', 'Logo bordir 8 cm di dada kiri'],
            ['placement', 'Artwork belakang ukuran A4'],
            ['packing', 'Individual polybag dan size sticker'],
        ] as [$type, $value]) {
            OrderSpecification::updateOrCreate(
                ['pesanan_id' => $order->id, 'jenis_spesifikasi' => $type],
                ['value' => $value]
            );
        }

        $sizes = ['S', 'M', 'L', 'XL'];
        $bucketCount = count($sizes) * 2;
        $baseQty = intdiv($quantity, $bucketCount);
        $remainder = $quantity % $bucketCount;
        $position = 0;
        foreach (['Navy', 'Hitam'] as $color) {
            foreach ($sizes as $size) {
                PesananSizeBreakdown::updateOrCreate(
                    ['pesanan_id' => $order->id, 'color' => $color, 'size_label' => $size, 'fabric_spec' => 'Combed 24s'],
                    [
                        'qty' => $baseQty + ($position < $remainder ? 1 : 0),
                        'sort_order' => $position + 1,
                        'harga_jual_per_pcs' => $order->harga_jual_per_pcs,
                    ]
                );
                $position++;
            }
        }
    }

    private function seedQuotation(JobTicket $ticket, Pesanan $order, Product $product, int $quantity, string $ticketNumber, string $stage): void
    {
        $price = (float) $order->harga_jual_per_pcs;
        $subtotal = $price * $quantity;
        $status = match ($stage) {
            'quotation' => 'draft',
            'design' => 'sent',
            default => 'approved',
        };
        $tax = $ticket->companyProfile?->tax_percentage ? $subtotal * 0.11 : 0;
        $quotation = Quotation::updateOrCreate(
            ['quotation_number' => 'DEMO-Q-'.substr($ticketNumber, -3)],
            [
                'job_ticket_id' => $ticket->id,
                'status' => $status,
                'valid_until' => now()->addDays(30)->toDateString(),
                'sample_qty' => 2,
                'payment_terms' => 'DP 50%, pelunasan sebelum pengiriman.',
                'delivery_terms' => 'Pengiriman 14-21 hari kerja setelah sample disetujui.',
                'notes' => 'Penawaran simulasi; harga dapat berubah setelah konfirmasi artwork.',
                'price_per_pcs' => $price,
                'quantity' => $quantity,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'delivery_cost' => 150000,
                'grand_total' => $subtotal + $tax + 150000,
                'approved_at' => $status === 'approved' ? now()->subDays(10) : null,
                'approved_by_name' => $status === 'approved' ? $ticket->customer_nama_snapshot : null,
                'created_by' => $this->users['admin@victorylabs.id']->id,
                'source_type' => 'job_ticket',
            ]
        );
        $item = QuotationItem::updateOrCreate(
            ['quotation_id' => $quotation->id, 'pesanan_id' => $order->id],
            [
                'item_name' => $product->name,
                'fabric' => 'Combed 24s / sesuai artikel',
                'print_method' => 'Bordir dan DTF',
                'quantity' => $quantity,
                'price_per_pcs' => $price,
                'subtotal' => $subtotal,
            ]
        );
        foreach (['S', 'M', 'L', 'XL'] as $size) {
            $sizeQty = (int) $order->sizeBreakdowns()->where('size_label', $size)->sum('qty');
            QuotationItemSize::updateOrCreate(
                ['quotation_item_id' => $item->id, 'size_label' => $size],
                ['qty' => $sizeQty, 'price_per_pcs' => $price, 'sub_total' => $sizeQty * $price]
            );
        }
        QuotationNote::updateOrCreate(
            ['quotation_id' => $quotation->id],
            ['notes' => 'Pastikan logo final dan size breakdown disetujui sebelum produksi.']
        );
    }

    private function seedDesign(Pesanan $order, string $ticketNumber, string $stage): void
    {
        $status = match ($stage) {
            'quotation' => 'draft', 'design' => 'waiting_approval',
            'revision' => 'revision_needed', default => 'approved',
        };
        Design::updateOrCreate(
            ['pesanan_id' => $order->id],
            [
                'designer_id' => $this->users['designer@victorylabs.id']->id,
                'file_path' => 'demo/designs/'.$ticketNumber.'.png',
                'preview_path' => 'demo/designs/'.$ticketNumber.'-preview.png',
                'revision_note' => $status === 'revision_needed' ? 'Mohon perbesar logo bagian belakang.' : null,
                'customer_revision_note' => $status === 'revision_needed' ? 'Warna logo gunakan versi putih.' : null,
                'designer_revision_note' => null,
                'status' => $status,
                'uploaded_at' => $status === 'draft' ? null : now()->subDays(8),
                'approved_at' => $status === 'approved' ? now()->subDays(5) : null,
                'approved_by' => $status === 'approved' ? $this->users['admin@victorylabs.id']->id : null,
            ]
        );
    }

    private function seedWorkflow(Pesanan $order, JobTicket $ticket, string $stage, int $stageIndex): void
    {
        $flagAt = static fn (int $threshold): bool => $stageIndex >= $threshold;
        WorkflowStatus::updateOrCreate(
            ['pesanan_id' => $order->id],
            [
                'design_uploaded' => $flagAt(1), 'design_approved' => $flagAt(3),
                'article_synced' => $flagAt(1), 'design_specs_completed' => $flagAt(1),
                'price_approved' => $flagAt(2), 'quotation_created' => true,
                'quotation_approved' => $stageIndex >= 2, 'purchasing_generated' => $flagAt(4),
                'materials_purchased' => $flagAt(5), 'materials_received' => $flagAt(5),
                'materials_distributed' => $flagAt(5), 'sample_materials_ready' => $flagAt(3),
                'production_materials_ready' => $flagAt(5), 'sample_invoice_created' => $flagAt(3),
                'sample_paid' => $flagAt(4), 'sample_created' => $flagAt(3),
                'sample_started' => $flagAt(3), 'sample_completed' => $flagAt(4),
                'sample_uploaded' => $flagAt(4), 'sample_delivered' => $flagAt(4),
                'sample_approved' => $flagAt(4), 'sample_revision' => $stage === 'revision',
                'production_invoice_created' => $flagAt(5),
                'production_dp_paid' => $stageIndex === 5 || $stageIndex === 7,
                'final_payment_paid' => $flagAt(7), 'production_created' => $flagAt(5),
                'production_started' => $flagAt(5), 'production_completed' => $flagAt(7),
                'qc_completed' => $flagAt(7), 'packing_completed' => $flagAt(7),
                'delivered' => $flagAt(7), 'completed' => $flagAt(7),
            ]
        );

        $history = [['order_entry', 'created', 'Job ticket dibuat dan pesanan dicatat.']];
        $milestones = [
            [1, 'design', 'uploaded', 'Artwork awal disiapkan oleh tim desain.'],
            [2, 'quotation', 'approved', 'Penawaran disetujui customer.'],
            [3, 'sample', 'started', 'Pembuatan sample dimulai.'],
            [4, 'purchasing', 'generated', 'Kebutuhan bahan dibuat dari BOM pesanan.'],
            [5, 'production', 'started', 'Produksi massal mulai berjalan.'],
            [6, 'quality_control', 'checked', 'Pemeriksaan QC dan pencatatan hasil produksi.'],
            [7, 'delivery', 'completed', 'Pesanan selesai dikirim ke customer.'],
        ];
        foreach ($milestones as [$threshold, $step, $action, $notes]) {
            if ($stageIndex >= $threshold) {
                $history[] = [$step, $action, $notes];
            }
        }
        foreach ($history as [$step, $action, $notes]) {
            WorkflowHistory::firstOrCreate(
                ['job_ticket_id' => $ticket->id, 'step' => $step, 'action' => $action],
                ['user_id' => $this->users['admin@victorylabs.id']->id, 'notes' => $notes]
            );
        }
    }

    private function seedSample(Pesanan $order, int $quantity, string $ticketNumber, int $stageIndex): Sample
    {
        $status = match (true) {
            $stageIndex === 3 => 'in_production',
            $stageIndex === 4 => 'delivered',
            default => 'approved',
        };
        $sample = Sample::updateOrCreate(
            ['pesanan_id' => $order->id, 'revision_number' => 0],
            [
                'qty' => 2, 'sample_price' => 125000, 'parent_sample_id' => null,
                'is_chargeable' => true, 'status' => $status,
                'catatan' => 'Sample awal untuk validasi warna dan ukuran.',
                'customer_review_note' => $status === 'approved' ? 'Sample disetujui untuk lanjut produksi.' : null,
                'internal_note' => 'Project '.$ticketNumber.' / total produksi '.$quantity.' pcs.',
                'created_by' => $this->users['designer@victorylabs.id']->id,
                'created_sample_at' => now()->subDays(6),
                'paid_at' => $stageIndex >= 4 ? now()->subDays(5) : null,
                'sent_at' => $stageIndex >= 4 ? now()->subDays(3) : null,
                'approved_at' => $status === 'approved' ? now()->subDays(2) : null,
                'approved_by' => $status === 'approved' ? $this->users['admin@victorylabs.id']->id : null,
            ]
        );
        if ($stageIndex >= 4) {
            SampleDelivery::updateOrCreate(
                ['sample_id' => $sample->id],
                [
                    'courier_name' => 'JNE',
                    'tracking_number' => 'DEMO-SMP-'.substr($ticketNumber, -3),
                    'tracking_url' => 'https://www.jne.co.id/',
                    'status' => 'delivered',
                    'sent_at' => now()->subDays(3),
                    'received_at' => now()->subDays(2),
                    'delivery_note' => 'Paket sample diterima dengan baik.',
                ]
            );
        }

        return $sample;
    }

    private function seedPurchasing(Pesanan $order, int $stageIndex): void
    {
        foreach ($order->materialSpecs()->with('material')->get() as $spec) {
            if (! $spec->material) {
                continue;
            }
            $required = (float) $spec->total_usage;
            $purchaseQty = ceil($required * 1.05 * 100) / 100;
            $isPartial = $stageIndex === 4;
            $receivedQty = $isPartial ? round($purchaseQty * 0.45, 2) : $purchaseQty;
            $purchasing = Purchasing::updateOrCreate(
                ['pesanan_id' => $order->id, 'pesanan_material_spec_id' => $spec->id],
                [
                    'supplier_id' => $spec->supplier_id,
                    'item_bahan' => $spec->material_name_snapshot,
                    'color' => $spec->color,
                    'qty_bahan' => $purchaseQty,
                    'required_qty' => $required,
                    'purchase_qty' => $purchaseQty,
                    'stock_qty' => 0,
                    'leftover_qty' => max(0, $purchaseQty - $required),
                    'satuan' => $spec->unit,
                    'harga_satuan' => $spec->harga_ecer,
                    'total_harga' => $purchaseQty * (float) $spec->harga_ecer,
                    'is_received' => ! $isPartial,
                    'tgl_pembelian' => now()->subDays(4)->toDateString(),
                    'received_qty' => (int) $receivedQty,
                    'status' => $isPartial ? 'partial_received' : 'received',
                    'purchase_scope' => 'sample_and_production',
                    'notes' => $isPartial ? 'Penerimaan bertahap; sisa sedang dikirim supplier.' : 'Bahan diterima dan siap didistribusikan.',
                ]
            );
            MaterialReceiving::updateOrCreate(
                ['purchasing_id' => $purchasing->id, 'received_at' => now()->subDays(2)->startOfDay()],
                [
                    'received_qty' => $receivedQty,
                    'checked_by' => $this->users['purchasing@victorylabs.id']->id,
                    'item_condition' => 'good',
                    'notes' => $isPartial ? 'Penerimaan pertama, kondisi baik.' : 'Jumlah sesuai dan kondisi baik.',
                ]
            );
        }
    }

    private function seedProduction(JobTicket $ticket, Pesanan $order, int $quantity, string $ticketNumber, int $stageIndex): void
    {
        $isComplete = $stageIndex === 7;
        $isQc = $stageIndex === 6;
        $run = ProductionRun::updateOrCreate(
            ['pesanan_id' => $order->id, 'type' => 'production'],
            [
                'status' => $isComplete ? 'completed' : ($isQc ? 'waiting_qc' : 'in_progress'),
                'started_at' => now()->subDays(8),
                'completed_at' => $isComplete ? now()->subDays(1) : null,
                'packing_completed' => $isComplete,
                'packed_at' => $isComplete ? now()->subDay() : null,
                'packing_notes' => $isComplete ? 'Packing per size dan warna sudah diverifikasi.' : null,
                'courier_name' => $isComplete ? 'J&T Cargo' : null,
                'tracking_number' => $isComplete ? 'DEMO-DEL-'.substr($ticketNumber, -3) : null,
                'tracking_url' => $isComplete ? 'https://www.jet.co.id/' : null,
                'delivery_note' => $isComplete ? 'Diterima customer tanpa selisih quantity.' : null,
                'customer_review_note' => $isComplete ? 'Barang diterima dengan baik.' : null,
                'approved_at' => $isComplete ? now() : null,
            ]
        );
        foreach ($order->manufacturingSpecs()->orderBy('sort_order')->get() as $sequence => $spec) {
            $isProductionStep = $spec->process_behavior === 'production_process';
            $processStatus = $isComplete || ($isQc && $sequence < 3) ? 'completed' : 'in_progress';
            $defectQty = $isQc && $sequence === 0 ? 4 : 0;
            $process = ProductionRunProcess::updateOrCreate(
                ['production_run_id' => $run->id, 'pesanan_manufacturing_spec_id' => $spec->id],
                [
                    'work_name' => $spec->work_name_snapshot,
                    'sequence' => $sequence + 1,
                    'status' => $processStatus,
                    'quantity' => $quantity,
                    'worker_qty' => $isProductionStep ? 6 + ($sequence % 4) : null,
                    'started_at' => now()->subDays(7),
                    'completed_at' => $processStatus === 'completed' ? now()->subDays(1) : null,
                    'checked_qty' => $isQc || $isComplete ? $quantity : 0,
                    'passed_qty' => $isQc || $isComplete ? $quantity - $defectQty : 0,
                    'defect_qty' => $defectQty,
                    'qc_status' => $defectQty ? 'failed' : (($isQc || $isComplete) ? 'passed' : 'pending'),
                    'qc_checked_at' => $isQc || $isComplete ? now()->subDays(1) : null,
                    'qc_checked_by' => $isQc || $isComplete ? $this->users['kepala_produksi@victorylabs.id']->id : null,
                    'qc_notes' => $defectQty ? 'Ditemukan jahitan terbuka pada beberapa potong.' : null,
                    'corrective_action' => $defectQty ? 'rework' : null,
                ]
            );
            if ($isQc && $defectQty > 0) {
                ProductionDefectHistory::updateOrCreate(
                    ['production_run_process_id' => $process->id],
                    [
                        'job_ticket_id' => $ticket->id,
                        'pesanan_id' => $order->id,
                        'defect_qty' => $defectQty,
                        'defect_reason' => 'Jahitan terbuka pada sambungan sisi.',
                        'corrective_action' => 'rework',
                        'status' => 'in_progress',
                        'reported_by' => $this->users['kepala_produksi@victorylabs.id']->id,
                    ]
                );
            }
            if ($isQc || $isComplete) {
                ProductionQcLog::updateOrCreate(
                    ['production_run_process_id' => $process->id, 'qc_type' => 'initial_check'],
                    [
                        'checked_qty' => $quantity,
                        'passed_qty' => $quantity - $defectQty,
                        'defect_qty' => $defectQty,
                        'defect_reason' => $defectQty ? 'Jahitan terbuka' : null,
                        'corrective_action' => $defectQty ? 'rework' : null,
                        'checked_by' => $this->users['kepala_produksi@victorylabs.id']->id,
                    ]
                );
            }
        }
    }

    private function seedInvoice(JobTicket $ticket, Pesanan $order, int $quantity, float $unitPrice, string $type, string $ticketNumber, string $status, bool $paid): Invoice
    {
        $subtotal = $quantity * $unitPrice;
        $invoice = Invoice::updateOrCreate(
            ['no_invoice' => 'DEMO-'.$type.'-'.substr($ticketNumber, -3)],
            [
                'job_ticket_id' => $ticket->id,
                'kategori_invoice' => $type === 'SAMPLE' ? 'Sample' : 'Produksi',
                'total_tagihan' => $subtotal,
                'status_tagihan' => $status,
                'tgl_jatuh_tempo' => now()->addDays(14)->toDateString(),
            ]
        );
        InvoiceItem::updateOrCreate(
            ['invoice_id' => $invoice->id, 'pesanan_id' => $order->id],
            [
                'item_name' => $type === 'SAMPLE' ? 'Sample '.$order->produk : $order->produk,
                'quantity' => $quantity,
                'price_per_pcs' => $unitPrice,
                'subtotal' => $subtotal,
            ]
        );
        if ($paid && ! $invoice->payments()->exists()) {
            $this->seedPayment($invoice, $subtotal, true);
        }

        return $invoice;
    }

    private function seedPayment(Invoice $invoice, float $amount, bool $verified): void
    {
        Payment::updateOrCreate(
            ['invoice_id' => $invoice->id, 'jumlah_bayar' => $amount],
            [
                'tgl_bayar' => now()->subDays(2)->toDateString(),
                'metode_pembayaran' => 'Transfer Bank',
                'bukti_transfer_path' => 'demo/payments/'.$invoice->no_invoice.'.pdf',
                'catatan_finance' => $verified ? 'Pembayaran terverifikasi untuk simulasi.' : 'Pembayaran DP 50%.',
                'status' => $verified ? 'verified' : 'pending',
                'verified_by' => $verified ? $this->users['finance@victorylabs.id']->id : null,
                'verified_at' => $verified ? now()->subDays(1) : null,
            ]
        );
    }

    private function seedProfitAndProgress(Pesanan $order, int $quantity, int $stageIndex): void
    {
        $revenue = $quantity * (float) $order->harga_jual_per_pcs;
        $cost = $quantity * (float) $order->estimasi_hpp_per_pcs;
        $profit = $revenue - $cost;
        ProfitLoss::updateOrCreate(
            ['pesanan_id' => $order->id],
            [
                'total_pendapatan' => $revenue,
                'hpp_realisasi' => $cost,
                'gop' => $profit,
                'margin_persentase' => $revenue > 0 ? ($profit / $revenue) * 100 : 0,
            ]
        );
        $completed = $stageIndex === 7;
        ProductionProgress::updateOrCreate(
            ['pesanan_id' => $order->id],
            [
                'prioritas' => $completed ? 'Low' : ($stageIndex === 6 ? 'Urgent' : 'High'),
                'started_at' => now()->subDays(8),
                'completed_at' => $completed ? now()->subDays(1) : null,
                'ppm_bahan' => true, 'ppm_aksesoris' => true,
                'ppm_cutting' => $stageIndex >= 5, 'ppm_sablon' => $stageIndex >= 5,
                'ppm_jahit' => $stageIndex >= 5,
                'cut_test_susut' => $stageIndex >= 5, 'cut_test_luntur' => $stageIndex >= 5,
                'cut_relax_bahan' => $stageIndex >= 5, 'cut_form_cutting' => $stageIndex >= 5,
                'cut_label_potongan' => $stageIndex >= 5, 'cut_sisa_bahan' => $stageIndex >= 5,
                'sablon_sample_warna' => $stageIndex >= 5, 'sablon_test_muntah' => $stageIndex >= 5,
                'jahit_kelengkapan_aksesoris' => $stageIndex >= 5,
                'jahit_titik_kritis' => $stageIndex >= 5, 'jahit_random_check' => $stageIndex >= 6,
                'qc_steam_packing' => $completed, 'qc_sampling_ukuran' => $stageIndex >= 6,
                'qc_inspeksi_jahit' => $stageIndex >= 6, 'qc_surat_jalan' => $completed,
                'log_foto_confirm' => $completed, 'log_random_cek' => $completed,
                'log_payment_delivery' => $completed,
                'status_produksi' => $completed ? 'Selesai dan terkirim' : ($stageIndex === 6 ? 'Menunggu tindak lanjut QC' : 'Produksi berjalan'),
            ]
        );
    }

    private function ticketStatus(string $stage): string
    {
        return match ($stage) {
            'quotation' => 'Quotation',
            'design', 'revision' => 'Design',
            'sample' => 'Sample',
            'purchasing' => 'Purchasing',
            'production' => 'Production',
            'quality' => 'Quality Control',
            default => 'Completed',
        };
    }
}
