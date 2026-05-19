<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $customers = Customer::query()
            ->with('pesanan')
            ->latest()
            ->get()
            ->map(fn ($customer) => [
                'id' => $customer->id,
                'name' => $customer->nama,
                'contact' => $customer->no_hp,
                'address' => $customer->alamat,
                'total_orders' => $customer->pesanan->count(),
                'order_history' => $customer->pesanan->map(fn ($order) => [
                    'id' => $order->id,
                    'job_ticket' => $order->no_job_ticket,
                    'item_name' => $order->produk,
                    'quantity' => $order->q,
                    'total_cost' => $order->harga_jual_per_pcs * $order->q,
                    'status' => $order->status_divisi,
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
            'no_hp' => ['required', 'string', 'max:20'],
            'alamat' => ['required', 'string'],
        ]);

        Customer::create($validated);

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
            'no_hp' => ['required', 'string', 'max:20'],
            'alamat' => ['required', 'string'],
        ]);

        $customer->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        $customer->delete();

        return back();
    }
}
