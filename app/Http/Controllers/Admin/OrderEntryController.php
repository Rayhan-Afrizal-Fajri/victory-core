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

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'no_job_ticket' => ['required', 'string', 'unique:pesanan,no_job_ticket'],
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
            'size_breakdowns.*.size_label' => ['nullable', 'string', 'max:50'],
            'size_breakdowns.*.qty' => ['nullable', 'integer', 'min:1'],
        ]);

        if (empty($validated['customer_id']) && empty($validated['new_customer_name'])) {
            throw ValidationException::withMessages([
                'customer_id' => 'Pilih customer atau buat customer baru.',
                'new_customer_name' => 'Nama customer baru wajib diisi jika tidak memilih customer existing.',
            ]);
        }

        if (!empty($validated['size_breakdowns'])) {
            $totalSizeQty = collect($validated['size_breakdowns'])->sum('qty');

            if ($totalSizeQty !== (int) $validated['q']) {
                throw ValidationException::withMessages([
                    'size_breakdowns' => 'Total size breakdown harus sama dengan quantity order.',
                ]);
            }
        }

        $customer = null;

        if (! empty($validated['customer_id'])) {
            $customer = Customer::findOrFail($validated['customer_id']);
        } else {
            // Optional: kalau mau langsung buat akun customer
            // Pastikan kolom dan model User kamu sesuai.
            
            if (! empty($validated['new_customer_email'])) {
                $user = User::firstOrCreate(
                    ['email' => $validated['new_customer_email']],
                    [
                        'name' => $validated['new_customer_name'],
                        'password' => bcrypt('password'),
                    ]
                );

                $user->assignRole('Customer');

                $customer = Customer::create([
                    'user_id' => $user->id,
                    'nama' => $validated['new_customer_name'],
                    'nama_perusahaan' => $validated['new_customer_company'] ?? $validated['new_customer_name'],
                    'no_hp' => $validated['new_customer_phone'] ?? null,
                    'alamat' => $validated['new_customer_address'] ?? null,
                ]);
            }
            
        }

        $pesanan = DB::transaction(function () use ($validated, $customer) {
            $pesanan = Pesanan::create([
                'no_job_ticket' => $validated['no_job_ticket'],
                'customer_id' => $validated['customer_id'],

                // legacy compatibility
                'produk' => $validated['requested_product_name'],
                'q' => $validated['q'],
                'keterangan_tambahan' => $validated['customer_notes'] ?? null,

                // new fields
                'requested_product_name' => $validated['requested_product_name'],
                'deadline' => $validated['deadline'],
                'customer_notes' => $validated['customer_notes'] ?? null,

                'date' => now(),
                'customer_nama_snapshot' => $customer->nama,
                'customer_perusahaan_snapshot' => $customer->nama_perusahaan,

                'status_divisi' => 'Order Entry',
                'created_by' => Auth::id(),
            ]);

            if (!empty($validated['size_breakdowns'])) {
                foreach ($validated['size_breakdowns'] as $sizeBreakdown) {
                    // $pesanan->orderSpecification()->create([
                    //     'type' => 'size_breakdown',
                    //     'key' => $sizeBreakdown['color'] . ' - ' . $sizeBreakdown['size_label'],
                    //     'value' => (string) $sizeBreakdown['qty'],
                    // ]);

                    $pesanan->sizeBreakdowns()->create([
                        'color' => $sizeBreakdown['color'] ?? null,
                        'size_label' => $sizeBreakdown['size_label'] ?? null,
                        'qty' => $sizeBreakdown['qty'] ?? 0,
                    ]);
                }
            }

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'order_entry' => true,
                    'design_uploaded' => false,
                    'design_approved' => false,
                ]
            );

            $pesanan->productionProgress()->create([]);

            return $pesanan;
        });

        return redirect()
            ->route('job-tickets.show', $pesanan->id);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
