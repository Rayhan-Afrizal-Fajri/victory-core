<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Pesanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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
            'no_job_ticket' => ['required', 'string'],
            'customer_id' => ['required', 'exists:customers,id'],
            'produk' => ['required', 'string'],
            'q' => ['required', 'integer', 'min:1'],
            'qs' => ['required', 'integer', 'min:1'],
            'deadline' => ['required', 'date'],
            'harga_jual_per_pcs' => ['required', 'numeric'],
            'estimasi_hpp_per_pcs' => ['required', 'numeric'],
            'keterangan_tambahan' => ['nullable', 'string'],
        ]);

        $pesanan = Pesanan::create([
            ...$validated,
            'date' => now(),

            'status_divisi' => 'Penawaran',
            'created_by' => Auth::user()->id,
        ]);

        $pesanan->productionProgress()->create([]);

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
