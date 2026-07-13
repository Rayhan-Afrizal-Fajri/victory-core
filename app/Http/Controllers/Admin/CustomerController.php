<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $customers = Customer::query()
            ->with('jobTicket.pesanans')
            ->latest()
            ->get()
            ->map(fn ($customer) => [
                'id' => $customer->id,
                'name' => $customer->nama,
                'position' => $customer->jabatan,
                'company_name' => $customer->nama_perusahaan,
                'contact' => $customer->no_hp,
                'province' => $customer->provinsi,
                'city' => $customer->kota,
                'district' => $customer->kecamatan,
                'village' => $customer->kelurahan,
                'detail_address' => $customer->alamat_detail,
                'total_orders' => $customer->jobTicket->count(),
                'order_history' => $customer->jobTicket->map(fn ($order) => [
                    'id' => $order->id,
                    'job_ticket' => $order->no_job_ticket,
                    'item_names' => $order->pesanans
                        ->map(fn ($pesanan) =>
                            $pesanan->requested_product_name
                            ?: $pesanan->produk
                            ?: '-'
                        )
                        ->filter()
                        ->unique()
                        ->implode(', '),
                    'quantity' => (int) $order->pesanans->sum('q'),
                    'total_cost' => (float) $order->invoices
                        ->whereNotIn('status_tagihan', ['cancelled'])
                        ->sum('total_tagihan'),
                    'status' => $order->status,
                ])->values(),
            ]);

        return Inertia::render('admin/customers/Index', [
            'customers' => $customers,
        ]);
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
            'nama' => ['required', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'nama_perusahaan' => ['required', 'string', 'max:255'],
            'no_hp' => ['required', 'string', 'max:20'],
            'provinsi' => ['required', 'string'],
            'kota' => ['required', 'string'],
            'kecamatan' => ['required', 'string'],
            'kelurahan' => ['required', 'string'],
            'alamat_detail' => ['required', 'string'],
        ]);

        DB::transaction(function () use ($validated) {

            // // buat user dulu
            // $user = User::create([
            //     'name' => $validated['nama'],
            //     'email' => $validated['email'],
            //     'password' => bcrypt('password'),
            //     'is_active' => true,
            // ]);

            // $user->assignRole('Customer');

            // baru buat customer
            Customer::create([
                'nama' => $validated['nama'],
                'jabatan' => $validated['jabatan'],
                'nama_perusahaan' => $validated['nama_perusahaan'],
                'no_hp' => $validated['no_hp'],
                'provinsi' => $validated['provinsi'],
                'kota' => $validated['kota'],
                'kecamatan' => $validated['kecamatan'],
                'kelurahan' => $validated['kelurahan'],
                'alamat_detail' => $validated['alamat_detail'],
            ]);
        });

        return back();
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
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'nama_perusahaan' => ['required', 'string', 'max:255'],
            'no_hp' => ['required', 'string', 'max:20'],
            'provinsi' => ['required', 'string'],
            'kota' => ['required', 'string'],
            'kecamatan' => ['required', 'string'],
            'kelurahan' => ['required', 'string'],
            'alamat_detail' => ['required', 'string'],
        ]);

        $customer->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        
        DB::transaction(function () use ($customer) {
            // 1. Ambil ID user login miliknya
            $userId = $customer->user_id;

            // 2. Hapus data profile customer terlebih dahulu
            // Pesanan tidak akan hilang, customer_id di tb_pesanan otomatis berubah jadi NULL berkat nullOnDelete()
            $customer->delete();

            // 3. Hapus akun login user-nya
            // if ($userId) {
            //     User::where('id', $userId)->delete();
            // }
        });

        return back();
    }
}
