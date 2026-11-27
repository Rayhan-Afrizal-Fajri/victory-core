<?php

namespace Tests\Feature;

use App\Models\CompanyProfile;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\JobTicket;
use App\Models\Pesanan;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\SuratJalan;
use App\Models\SuratJalanItem;
use App\Models\User;
use App\Services\Export\DocumentDocxService;
use DOMDocument;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use ZipArchive;

class DocumentDocxServiceTest extends TestCase
{
    private User $user;

    private CompanyProfile $companyProfile;

    private Customer $customer;

    private JobTicket $jobTicket;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();

        $mysqlOnlyMigrations = [
            '2026_09_26_075216_modify_quotations_table.php',
            '2026_10_03_000002_backfill_existing_quotation_snapshots.php',
            '2026_10_12_000001_update_job_ticket_id_cascade_on_quotations_table.php',
        ];

        $files = glob(database_path('migrations/*.php')) ?: [];
        sort($files);

        foreach ($files as $file) {
            $basename = basename($file);
            if (in_array($basename, $mysqlOnlyMigrations, true)) {
                if ($basename === '2026_09_26_075216_modify_quotations_table.php' && Schema::hasTable('quotations')) {
                    Schema::table('quotations', function (Blueprint $table) {
                        $table->unsignedBigInteger('job_ticket_id')->nullable()->change();
                    });
                }

                continue;
            }

            Artisan::call('migrate', ['--path' => 'database/migrations/' . $basename]);
        }

        $this->user = User::factory()->create(['is_active' => true]);

        $this->companyProfile = CompanyProfile::create([
            'company_name' => 'PT Victory & Partners <ID>',
            'company_type' => 'non_pkp',
            'bank_type' => 'BCA',
            'tax_percentage' => 0,
            'account_number' => '1234567890',
            'account_name' => 'PT Victory & Partners',
            'address' => 'Jl. Raya & Industri No. 1',
            'swift_code' => 'CENAIDJA',
        ]);

        $this->customer = Customer::create([
            'nama' => 'Budi & Co',
            'nama_perusahaan' => 'CV Maju & Jaya <2026>',
            'kontak' => '081234567890',
            'alamat_detail' => 'Jl. Merdeka & Damai',
        ]);

        $this->jobTicket = JobTicket::create([
            'no_job_ticket' => 'JT-DOCX-001',
            'date' => now()->toDateString(),
            'deadline' => now()->addDays(14)->toDateString(),
            'customer_id' => $this->customer->id,
            'company_profile_id' => $this->companyProfile->id,
            'customer_nama_snapshot' => $this->customer->nama,
            'customer_perusahaan_snapshot' => $this->customer->nama_perusahaan,
            'status' => 'Invoice',
            'created_by' => $this->user->id,
        ]);
    }

    public function test_generated_invoice_docx_contains_valid_escaped_xml(): void
    {
        $pesanan = Pesanan::create([
            'job_ticket_id' => $this->jobTicket->id,
            'produk' => 'Kaos & Sablon',
            'requested_product_name' => 'Kaos & Sablon',
            'q' => 10,
            'qs' => 10,
        ]);

        $invoice = Invoice::create([
            'job_ticket_id' => $this->jobTicket->id,
            'no_invoice' => 'SAMPLE/2026/10/0011',
            'kategori_invoice' => 'production',
            'total_tagihan' => 1500000,
            'delivery_cost' => 0,
            'status_tagihan' => 'unpaid',
            'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
            'notes' => 'Syarat & ketentuan <khusus>',
            'created_by' => $this->user->id,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'pesanan_id' => $pesanan->id,
            'item_name' => 'Art: T-Shirt & Hoodie',
            'quantity' => 10,
            'price_per_pcs' => 150000,
            'subtotal' => 1500000,
        ]);

        $invoice->load([
            'jobTicket.customer',
            'jobTicket.companyProfile',
            'jobTicket.quotations',
            'jobTicket.latestSuratJalan',
            'items.pesanan.sizeBreakdowns',
            'payments',
        ]);

        $filePath = app(DocumentDocxService::class)->generateInvoiceDocx($invoice);

        try {
            $documentXml = $this->assertDocxArchiveIsWellFormed($filePath);
            $this->assertStringContainsString('Pesan &amp; Ketentuan Pembayaran:', $documentXml);
            $this->assertStringContainsString('Syarat &amp; ketentuan &lt;khusus&gt;', $documentXml);
        } finally {
            @unlink($filePath);
        }
    }

    public function test_generated_quotation_and_surat_jalan_docx_contain_valid_escaped_xml(): void
    {
        $quotation = Quotation::create([
            'job_ticket_id' => $this->jobTicket->id,
            'customer_id' => $this->customer->id,
            'company_profile_id' => $this->companyProfile->id,
            'quotation_number' => 'QUO/2026/10/0011',
            'status' => 'approved',
            'subtotal' => 500000,
            'tax' => 0,
            'delivery_cost' => 0,
            'grand_total' => 500000,
            'payment_terms' => 'DP 50% & Pelunasan',
            'delivery_terms' => 'Kirim via JNE & Cargo',
            'notes' => 'Catatan & info <penting>',
            'created_by' => $this->user->id,
        ]);

        QuotationItem::create([
            'quotation_id' => $quotation->id,
            'item_name' => 'Polo & Bordir',
            'fabric' => 'Lacoste & Cotton',
            'print_method' => 'Bordir & DTF',
            'quantity' => 5,
            'price_per_pcs' => 100000,
            'subtotal' => 500000,
        ]);

        $quotation->load(['jobTicket.customer', 'jobTicket.companyProfile', 'customer', 'companyProfile', 'items']);

        $suratJalan = SuratJalan::create([
            'job_ticket_id' => $this->jobTicket->id,
            'company_profile_id' => $this->companyProfile->id,
            'customer_id' => $this->customer->id,
            'surat_jalan_number' => 'SJ/2026/10/0011',
            'delivery_date' => now()->toDateString(),
            'customer_name_snapshot' => 'Budi & Co',
            'customer_company_snapshot' => 'CV Maju & Jaya',
            'customer_address_snapshot' => 'Jl. Merdeka & Damai',
            'customer_phone_snapshot' => '081234567890',
            'courier_name' => 'Kurir A & B',
            'created_by' => $this->user->id,
        ]);

        SuratJalanItem::create([
            'surat_jalan_id' => $suratJalan->id,
            'product_name' => 'Kaos & Jaket',
            'description' => 'Size M & L <Packing Dus>',
            'quantity' => 5,
        ]);

        $suratJalan->load(['items', 'companyProfile', 'customer', 'jobTicket']);

        $service = app(DocumentDocxService::class);
        $quotationPath = $service->generateQuotationDocx($quotation);
        $suratJalanPath = $service->generateSuratJalanDocx($suratJalan);

        try {
            $quotationXml = $this->assertDocxArchiveIsWellFormed($quotationPath);
            $this->assertStringContainsString('Pesan &amp; Ketentuan:', $quotationXml);
            $this->assertStringContainsString('DP 50% &amp; Pelunasan', $quotationXml);

            $suratJalanXml = $this->assertDocxArchiveIsWellFormed($suratJalanPath);
            $this->assertStringContainsString('Size M &amp; L &lt;Packing Dus&gt;', $suratJalanXml);
        } finally {
            @unlink($quotationPath);
            @unlink($suratJalanPath);
        }
    }

    private function assertDocxArchiveIsWellFormed(string $filePath): string
    {
        $this->assertFileExists($filePath);

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($filePath) === true, 'Generated .docx must be a valid zip archive.');

        $documentXml = '';
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (! is_string($name)) {
                continue;
            }
            if (str_ends_with($name, '.xml') || str_ends_with($name, '.rels')) {
                $content = $zip->getFromIndex($i);
                $this->assertIsString($content);

                $dom = new DOMDocument();
                $loaded = @$dom->loadXML($content);
                $this->assertTrue($loaded, "XML entry [{$name}] inside .docx must be well-formed.");

                if ($name === 'word/document.xml') {
                    $documentXml = $content;
                }
            }
        }

        $zip->close();
        $this->assertNotSame('', $documentXml);

        return $documentXml;
    }
}
