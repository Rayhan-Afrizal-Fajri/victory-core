<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Pesanan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderEntryController extends Controller
{
    private function orderEntryRules(?Pesanan $pesanan = null): array
    {
        return [
            'no_job_ticket' => [
                'required',
                'string',
                'max:100',
            ],

            'customer_id' => ['nullable', 'exists:customers,id'],

            'new_customer_name' => ['nullable', 'string', 'max:255'],
            'new_customer_company' => ['nullable', 'string', 'max:255'],
            'new_customer_email' => ['nullable', 'email', 'max:255'],
            'new_customer_phone' => ['nullable', 'string', 'max:50'],
            'new_customer_address' => ['nullable', 'string'],

            'requested_product_name' => ['required', 'string', 'max:255'],
            'q' => ['required', 'integer', 'min:1'],
            'deadline' => ['required', 'date'],
            'customer_notes' => ['nullable', 'string'],

            'size_breakdowns' => ['nullable', 'array'],
            'size_breakdowns.*.color' => ['nullable', 'string', 'max:100'],
            'size_breakdowns.*.size_label' => [
                'required_with:size_breakdowns',
                'nullable',
                'string',
                'max:50',
            ],
            'size_breakdowns.*.qty' => [
                'required_with:size_breakdowns',
                'nullable',
                'integer',
                'min:1',
            ],
        ];
    }

    private function validateOrderEntryData(array $validated): void
    {
        if (
            empty($validated['customer_id']) &&
            empty($validated['new_customer_name'])
        ) {
            throw ValidationException::withMessages([
                'customer_id' => 'Pilih customer atau buat customer baru.',
                'new_customer_name' => 'Nama customer baru wajib diisi.',
            ]);
        }

        if (
            empty($validated['customer_id']) &&
            empty($validated['new_customer_company'])
        ) {
            throw ValidationException::withMessages([
                'new_customer_company' => 'Perusahaan atau brand wajib diisi.',
            ]);
        }

        if (! empty($validated['size_breakdowns'])) {
            $totalSizeQty = collect($validated['size_breakdowns'])
                ->sum(fn ($row) => (int) ($row['qty'] ?? 0));

            if ($totalSizeQty !== (int) $validated['q']) {
                throw ValidationException::withMessages([
                    'size_breakdowns' =>
                        'Total size breakdown harus sama dengan quantity order.',
                ]);
            }
        }
    }

    private function resolveCustomer(array $validated): Customer
    {
        if (! empty($validated['customer_id'])) {
            return Customer::findOrFail($validated['customer_id']);
        }

        $user = null;

        if (! empty($validated['new_customer_email'])) {
            $user = User::firstOrCreate(
                ['email' => $validated['new_customer_email']],
                [
                    'name' => $validated['new_customer_name'],
                    'password' => bcrypt('password'),
                ],
            );

            if (! $user->hasRole('Customer')) {
                $user->assignRole('Customer');
            }
        }

        return Customer::create([
            'user_id' => $user?->id,
            'nama' => $validated['new_customer_name'],
            'nama_perusahaan' =>
                $validated['new_customer_company']
                ?? $validated['new_customer_name'],
            'email' => $validated['new_customer_email'] ?? null,
            'no_hp' => $validated['new_customer_phone'] ?? null,
            'alamat' => $validated['new_customer_address'] ?? null,
        ]);
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $lastJobTicket = Pesanan::latest('id')->first()?->no_job_ticket;
        $nextJobTicket = $lastJobTicket ? $this->generateNextJobTicket($lastJobTicket) : "VL-".date('Y')."-001";

        $customers = Customer::all()->map(fn ($customer) => [
            'id' => $customer->id,
            'name' => $customer->nama,
        ]);


        return Inertia::render('admin/order-entry/Index', [
            'nextJobTicket' => $nextJobTicket,
            'customers' => $customers,
        ]);
    }

    private function generateNextJobTicket(string $lastJobTicket)
    {
        // Assuming the format is "VL-YYYY-NNN"
        $parts = explode('-', $lastJobTicket);
        if (count($parts) !== 3) {
            throw new \Exception("Invalid job ticket format");
        }

        $prefix = $parts[0];
        $year = $parts[1];
        $number = (int)$parts[2];

        // Increment the number
        $number++;

        // Format the new job ticket
        return sprintf("%s-%s-%03d", $prefix, $year, $number);
    }

    private function syncSizeBreakdowns(
        Pesanan $pesanan,
        array $sizeBreakdowns,
    ): void {
        $pesanan->sizeBreakdowns()->delete();

        foreach ($sizeBreakdowns as $row) {
            $pesanan->sizeBreakdowns()->create([
                'color' => $row['color'] ?? null,
                'size_label' => $row['size_label'] ?? null,
                'qty' => (int) ($row['qty'] ?? 0),
            ]);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
        $validated = $request->validate($this->orderEntryRules());

        $this->validateOrderEntryData($validated);

        $pesanan = DB::transaction(function () use ($validated) {
            $customer = $this->resolveCustomer($validated);

            $pesanan = Pesanan::create([
                'no_job_ticket' => $validated['no_job_ticket'],
                'customer_id' => $customer->id,

                'produk' => $validated['requested_product_name'],
                'q' => $validated['q'],
                'keterangan_tambahan' =>
                    $validated['customer_notes'] ?? null,

                'requested_product_name' =>
                    $validated['requested_product_name'],
                'deadline' => $validated['deadline'],
                'customer_notes' =>
                    $validated['customer_notes'] ?? null,

                'date' => now(),
                'customer_nama_snapshot' => $customer->nama,
                'customer_perusahaan_snapshot' =>
                    $customer->nama_perusahaan,

                'status_divisi' => 'Order Entry',
                'created_by' => Auth::id(),
            ]);

            $this->syncSizeBreakdowns(
                $pesanan,
                $validated['size_breakdowns'] ?? [],
            );

            $pesanan->workflowStatus()->create([
                'order_entry' => true,
                'design_uploaded' => false,
                'design_approved' => false,
            ]);

            $pesanan->productionProgress()->create([]);

            $pesanan->workflowHistory()->create([
                'step' => 'order_entry',
                'action' => 'created',
                'user_id' => Auth::id(),
                'notes' => 'Job Ticket dibuat.',
            ]);

            return $pesanan;
        });

        return redirect()
            ->route('job-tickets.show', $pesanan->id)
            ->with('success', 'Job Ticket berhasil dibuat.');
    }

    public function edit(string $id)
    {
        $pesanan = Pesanan::findOrFail($id);

        $pesanan->load([
            'customer',
            'workflowStatus',
            'designs',
            'materialSpecs',
            'manufacturingSpecs',
            'sizeBreakdowns',
        ]);

        if (! $pesanan->canModifyOrderEntry()) {
            abort(
                422,
                'Job Ticket tidak bisa diedit karena proses desain sudah dimulai.',
            );
        }

        $customers = Customer::query()
            ->orderBy('nama')
            ->get()
            ->map(fn ($customer) => [
                'id' => $customer->id,
                'name' => $customer->nama_perusahaan
                    ? "{$customer->nama} — {$customer->nama_perusahaan}"
                    : $customer->nama,
            ]);

        return Inertia::render('admin/order-entry/Index', [
            'nextJobTicket' => null,
            'customers' => $customers,

            'editingOrder' => [
                'id' => $pesanan->id,
                'no_job_ticket' => $pesanan->no_job_ticket,
                'customer_id' => $pesanan->customer_id,
                'requested_product_name' =>
                    $pesanan->requested_product_name
                    ?: $pesanan->produk,
                'q' => (int) ($pesanan->quantity ?: $pesanan->q),
                'deadline' => optional($pesanan->deadline)
                    ->format('Y-m-d'),
                'customer_notes' =>
                    $pesanan->customer_notes
                    ?: $pesanan->keterangan_tambahan,
                'size_breakdowns' => $pesanan->sizeBreakdowns
                    ->map(fn ($row) => [
                        'color' => $row->color ?? '',
                        'size_label' => $row->size_label ?? '',
                        'qty' => (int) $row->qty,
                    ])
                    ->values(),
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $pesanan = Pesanan::findOrFail($id);

        $pesanan->load([
            'workflowStatus',
            'designs',
            'materialSpecs',
            'manufacturingSpecs',
        ]);

        if (! $pesanan->canModifyOrderEntry()) {
            abort(
                422,
                'Job Ticket tidak bisa diedit karena proses desain sudah dimulai.',
            );
        }

        $validated = $request->validate(
            $this->orderEntryRules($pesanan),
        );

        $this->validateOrderEntryData($validated);

        DB::transaction(function () use ($pesanan, $validated) {
            $customer = $this->resolveCustomer($validated);

            $pesanan->update([
                // no_job_ticket sengaja tidak diubah
                'customer_id' => $customer->id,

                'produk' => $validated['requested_product_name'],
                'q' => $validated['q'],
                'keterangan_tambahan' =>
                    $validated['customer_notes'] ?? null,

                'requested_product_name' =>
                    $validated['requested_product_name'],
                'deadline' => $validated['deadline'],
                'customer_notes' =>
                    $validated['customer_notes'] ?? null,

                'customer_nama_snapshot' => $customer->nama,
                'customer_perusahaan_snapshot' =>
                    $customer->nama_perusahaan,
            ]);

            $this->syncSizeBreakdowns(
                $pesanan,
                $validated['size_breakdowns'] ?? [],
            );

            $pesanan->workflowHistory()->create([
                'pesanan_id' => $pesanan->id,
                'step' => 'order_entry',
                'action' => 'updated',
                'user_id' => Auth::id(),
                'notes' => 'Data Order Entry diperbarui.',
            ]);
        });

        return redirect()
            ->route('job-tickets.show', $pesanan->id)
            ->with('success', 'Job Ticket berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pesanan $pesanan)
    {
        $pesanan->load([
            'workflowStatus',
            'designs',
            'materialSpecs',
            'manufacturingSpecs',
        ]);

        if (! $pesanan->canModifyOrderEntry()) {
            abort(
                422,
                'Job Ticket tidak bisa dihapus karena proses desain sudah dimulai.',
            );
        }

        DB::transaction(function () use ($pesanan) {
            // Jika relasi database sudah cascadeOnDelete,
            // penghapusan manual ini tidak diperlukan.
            $pesanan->sizeBreakdowns()->delete();
            $pesanan->workflowHistory()->delete();
            $pesanan->workflowStatus()->delete();
            $pesanan->productionProgress()->delete();

            $pesanan->delete();
        });

        return redirect()
            ->route('job-tickets.index')
            ->with('success', 'Job Ticket berhasil dihapus.');
    }
}
