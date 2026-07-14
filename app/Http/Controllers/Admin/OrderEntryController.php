<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DefaultSizeBreakdown;
use App\Models\JobTicket;
use App\Models\Pesanan;
use App\Models\User;
use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderEntryController extends Controller
{
    /**
     * Rules Validation (Mendukung Multiple Orders)
     */
    private function orderEntryRules(): array
    {
        return [
            'no_job_ticket' => ['required', 'string', 'max:100'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'company_profile_id' => ['nullable', 'exists:company_profiles,id'],
            'new_customer_name' => ['nullable', 'string', 'max:255'],
            'new_customer_company' => ['nullable', 'string', 'max:255'],
            'new_customer_email' => ['nullable', 'email', 'max:255'],
            'new_customer_phone' => ['nullable', 'string', 'max:50'],
            'new_customer_address' => ['nullable', 'string'],
            'deadline' => ['required', 'date'],
            'customer_notes' => ['nullable', 'string'],
            'sales_name' => ['nullable', 'string'],

            // Validasi Array Multiple Orders
            'orders' => ['required', 'array', 'min:1'],
            'orders.*.id' => ['nullable', 'exists:pesanan,id'],
            'orders.*.requested_product_name' => ['required', 'string', 'max:255'],
            'orders.*.q' => ['required', 'integer', 'min:1'],
            
            // Validasi Size Breakdown per Order
            'orders.*.size_breakdowns' => ['nullable', 'array'],
            'orders.*.size_breakdowns.*.color' => ['nullable', 'string', 'max:100'],
            'orders.*.size_breakdowns.*.fabric_spec' => ['nullable', 'string', 'max:50'],
            'orders.*.size_breakdowns.*.size_label' => ['nullable', 'string', 'max:50'],
            'orders.*.size_breakdowns.*.qty' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Custom Data Validation Logic
     */
    private function validateOrderEntryData(array $validated): void
    {
        if (empty($validated['customer_id']) && empty($validated['new_customer_name'])) {
            throw ValidationException::withMessages([
                'customer_id' => 'Pilih customer atau buat customer baru.',
            ]);
        }

        $seenProductNames = [];

        foreach ($validated['orders'] as $index => $order) {
            $normalizedProductName = mb_strtolower(trim((string) ($order['requested_product_name'] ?? '')));

            if ($normalizedProductName !== '' && isset($seenProductNames[$normalizedProductName])) {
                throw ValidationException::withMessages([
                    "orders.{$index}.requested_product_name" => "Nama produk pada pesanan ke-".($index + 1)." harus unik dan tidak boleh sama dengan pesanan lain.",
                ]);
            }

            if ($normalizedProductName !== '') {
                $seenProductNames[$normalizedProductName] = true;
            }

            if (!empty($order['size_breakdowns'])) {
                $totalSizeQty = collect($order['size_breakdowns'])->sum(fn ($row) => (int) ($row['qty'] ?? 0));

                $isSizeEmpty = count($order['size_breakdowns']) === 1
                    && empty($order['size_breakdowns'][0]['color'])
                    && empty($order['size_breakdowns'][0]['size_label'])
                    && empty($order['size_breakdowns'][0]['fabric_spec']);

                if (!$isSizeEmpty && $totalSizeQty !== (int) $order['q']) {
                    throw ValidationException::withMessages([
                        "orders.{$index}.size_breakdowns" => "Total size breakdown pada pesanan ke-".($index + 1)." harus sama dengan quantity order.",
                    ]);
                }
            }
        }
    }

    private function defaultSizeBreakdownOptions(): array
    {
        $grouped = DefaultSizeBreakdown::query()
            ->select('type', 'label')
            ->orderBy('sequence', 'asc')
            ->get()
            ->groupBy('type');

        return [
            'color' => $grouped->get('color', collect())->pluck('label')->values()->all(),
            'fabric' => $grouped->get('fabric', collect())->pluck('label')->values()->all(),
            'size' => $grouped->get('size', collect())->pluck('label')->values()->all(),
        ];
    }

    private function resolveCustomer(array $validated): Customer
    {
        if (!empty($validated['customer_id'])) {
            return Customer::findOrFail($validated['customer_id']);
        }

        $user = null;
        if (!empty($validated['new_customer_email'])) {
            $user = User::firstOrCreate(
                ['email' => $validated['new_customer_email']],
                ['name' => $validated['new_customer_name'], 'password' => bcrypt('password')]
            );
            if (!$user->hasRole('Customer')) {
                $user->assignRole('Customer');
            }
        }

        return Customer::create([
            'user_id' => $user?->id,
            'nama' => $validated['new_customer_name'],
            'nama_perusahaan' => $validated['new_customer_company'] ?? $validated['new_customer_name'],
            'email' => $validated['new_customer_email'] ?? null,
            'no_hp' => $validated['new_customer_phone'] ?? null,
            'alamat' => $validated['new_customer_address'] ?? null,
        ]);
    }

    public function index()
    {
        $lastJobTicket = JobTicket::latest('id')->first()?->no_job_ticket;
        $nextJobTicket = $lastJobTicket ? $this->generateNextJobTicket($lastJobTicket) : "VL-".date('Y')."-001";

        $customers = Customer::all()->map(fn ($customer) => [
            'id' => $customer->id,
            'name' => $customer->nama,
            'company_name' => $customer->nama_perusahaan ?? '',
        ]);

        $companyProfiles = CompanyProfile::all()->map(fn ($company) => [
            'id' => $company->id,
            'name' => $company->company_name,
            'type' => $company->company_type,
        ]);

        return Inertia::render('admin/order-entry/Index', [
            'nextJobTicket' => $nextJobTicket,
            'customers' => $customers,
            'companyProfiles' => $companyProfiles,
            'customer' => Auth::user()->customer,
            'defaultSizeBreakdowns' => $this->defaultSizeBreakdownOptions(),
        ]);
    }

    private function generateNextJobTicket(string $lastJobTicket)
    {
        $parts = explode('-', $lastJobTicket);
        if (count($parts) !== 3) return "VL-".date('Y')."-001";

        return sprintf("%s-%s-%03d", $parts[0], $parts[1], (int)$parts[2] + 1);
    }

    /**
     * Store (Membuat 1 JobTicket dengan multiple Pesanan)
     */
    public function store(Request $request)
    {
        $validated = $request->validate($this->orderEntryRules());
        $this->validateOrderEntryData($validated);

        $jobTicket = DB::transaction(function () use ($validated) {
            $customer = $this->resolveCustomer($validated);

            // 1. Buat Purchase Order
            $jobTicket = JobTicket::create([
                'no_job_ticket' => $validated['no_job_ticket'],
                'date' => now(),
                'customer_id' => $customer->id,
                'company_profile_id' => $validated['company_profile_id'],
                'customer_nama_snapshot' => $customer->nama,
                'customer_perusahaan_snapshot' => $customer->nama_perusahaan,
                'deadline' => $validated['deadline'],
                'customer_notes' => $validated['customer_notes'] ?? null,
                'sales_name' => $validated['sales_name'] ?? null,
                'status' => 'Order Entry',
                'created_by' => Auth::id(),
            ]);

            // 2. Looping Pembuatan Pesanan
            foreach ($validated['orders'] as $orderData) {
                $pesanan = $jobTicket->pesanans()->create([
                    'produk' => $orderData['requested_product_name'],
                    'requested_product_name' => $orderData['requested_product_name'],
                    'q' => $orderData['q'],
                    'deadline' => $validated['deadline'],
                ]);

                // Sync Size Breakdowns
                if (!empty($orderData['size_breakdowns'])) {
                    foreach ($orderData['size_breakdowns'] as $row) {
                        if(!empty($row['color']) || !empty($row['size_label'])) {
                            $pesanan->sizeBreakdowns()->create([
                                'color' => $row['color'] ?? null,
                                'size_label' => $row['size_label'] ?? null,
                                'fabric_spec' => $row['fabric_spec'] ?? null,
                                'qty' => (int) ($row['qty'] ?? 0),
                            ]);
                        }
                    }
                }

                // Default Workflow Status
                $pesanan->workflowStatus()->create([
                    'order_entry' => true,
                    'design_uploaded' => false,
                    'design_approved' => false,
                ]);
                $pesanan->productionProgress()->create([]);
                $pesanan->jobTicket->workflowHistory()->create([
                    'step' => 'order_entry',
                    'action' => 'created',
                    'user_id' => Auth::id(),
                    'notes' => "Pesanan {$pesanan->produk} masuk dalam Purchase Order.",
                ]);
            }

            return $jobTicket;
        });

        return redirect()->route('job-tickets.show', $jobTicket->id)->with('success', 'Purchase Order berhasil dibuat.');
    }

    /**
     * Edit
     */
    public function edit(string $id)
    {
        $jobTicket = JobTicket::with(['customer', 'pesanans.sizeBreakdowns', 'pesanans.workflowStatus', 'companyProfile'])->findOrFail($id);

        $customers = Customer::orderBy('nama')->get()->map(fn ($customer) => [
            'id' => $customer->id,
            'name' => $customer->nama_perusahaan ? "{$customer->nama} — {$customer->nama_perusahaan}" : $customer->nama,
        ]);

        $companyProfiles = CompanyProfile::all()->map(fn ($company) => [
            'id' => $company->id,
            'name' => $company->company_name,
            'type' => $company->company_type,
        ]);

        $mappedOrders = $jobTicket->pesanans->map(fn($pesanan) => [
            'id' => $pesanan->id,
            'workflowStatus' => $pesanan->workflowStatus->toArray(),
            'requested_product_name' => $pesanan->requested_product_name ?: $pesanan->produk,
            'q' => (int) $pesanan->q,
            'size_breakdowns' => $pesanan->sizeBreakdowns->isEmpty() 
                ? [['color' => '', 'size_label' => '', 'qty' => 1]] 
                : $pesanan->sizeBreakdowns->map(fn($row) => [
                    'color' => $row->color ?? '',
                    'fabric_spec' => $row->fabric_spec ?? '',
                    'size_label' => $row->size_label ?? '',
                    'qty' => (int) $row->qty,
                ])->values()
        ]);

        return Inertia::render('admin/order-entry/Index', [
            'nextJobTicket' => null,
            'customers' => $customers,
            'companyProfiles' => $companyProfiles,
            'defaultSizeBreakdowns' => $this->defaultSizeBreakdownOptions(),
            'editingJobTicket' => [
                'id' => $jobTicket->id,
                'no_job_ticket' => $jobTicket->no_job_ticket,
                'customer_id' => $jobTicket->customer_id,
                'company_profile_id' => $jobTicket->company_profile_id,
                'deadline' => $jobTicket->deadline,
                'customer_notes' => $jobTicket->customer_notes,
                'sales_name' => $jobTicket->sales_name,
                'orders' => $mappedOrders,
            ],
        ]);
    }

    /**
     * Update 
     */
    public function update(Request $request, string $id)
    {
        $jobTicket = JobTicket::findOrFail($id);


        $validated = $request->validate($this->orderEntryRules());
        $this->validateOrderEntryData($validated);

        DB::transaction(function () use ($jobTicket, $validated) {
            $customer = $this->resolveCustomer($validated);

            $jobTicket->update([
                'customer_id' => $customer->id,
                'company_profile_id' => $validated['company_profile_id'],
                'customer_nama_snapshot' => $customer->nama,
                'customer_perusahaan_snapshot' => $customer->nama_perusahaan,
                'deadline' => $validated['deadline'],
                'customer_notes' => $validated['customer_notes'] ?? null,
                'sales_name' => $validated['sales_name'] ?? null,
            ]);

            // Sync Orders (Delete yang tidak ada, Update yang ada, Create yang baru)
            $existingOrderIds = $jobTicket->pesanans()->pluck('id')->toArray();
            $payloadOrderIds = collect($validated['orders'])->pluck('id')->filter()->toArray();

            $pesananToDelete = array_diff($existingOrderIds, $payloadOrderIds);
            Pesanan::whereIn('id', $pesananToDelete)->delete(); // Pastikan ada trigger cascadeOnDelete

            foreach ($validated['orders'] as $orderData) {
                if (isset($orderData['id']) && in_array($orderData['id'], $existingOrderIds)) {
                    $pesanan = Pesanan::find($orderData['id']);
                    $pesanan->update([
                        'produk' => $orderData['requested_product_name'],
                        'requested_product_name' => $orderData['requested_product_name'],
                        'q' => $orderData['q'],
                        'deadline' => $validated['deadline'],
                    ]);
                } else {
                    $pesanan = $jobTicket->pesanans()->create([
                        'produk' => $orderData['requested_product_name'],
                        'requested_product_name' => $orderData['requested_product_name'],
                        'q' => $orderData['q'],
                        'deadline' => $validated['deadline'],
                    ]);
                    
                    // Inisialisasi default progress untuk pesanan baru
                    $pesanan->workflowStatus()->create(['order_entry' => true]);
                    $pesanan->productionProgress()->create([]);
                    $pesanan->jobTicket->workflowHistory()->create([
                        'step' => 'order_entry', 'action' => 'created', 'user_id' => Auth::id(), 'notes' => 'Pesanan ditambahkan susulan.'
                    ]);
                }

                // Sync Size Breakdown
                $pesanan->sizeBreakdowns()->delete();
                if (!empty($orderData['size_breakdowns'])) {
                    foreach ($orderData['size_breakdowns'] as $row) {
                        if(!empty($row['color']) || !empty($row['size_label'])) {
                            $pesanan->sizeBreakdowns()->create([
                                'color' => $row['color'] ?? null,
                                'size_label' => $row['size_label'] ?? null,
                                'fabric_spec' => $row['fabric_spec'] ?? null,
                                'qty' => (int) ($row['qty'] ?? 0),
                            ]);
                        }
                    }
                }
            }
        });

        return redirect()->route('job-tickets.show', $jobTicket->id)->with('success', 'Purchase Order berhasil diperbarui.');
    }

    public function destroy(JobTicket $jobTicket)
    {

        $jobTicket->delete();

        return redirect()->route('job-tickets.index')->with('success', 'Purchase Order berhasil dihapus.');
    }
}