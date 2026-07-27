<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Material;
use App\Models\Supplier;
use Closure;

class UpdateMaterialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required', 
                'string', 
                'max:255',
                // Custom Closure Validation
                function (string $attribute, mixed $value, Closure $fail) {
                    // Ambil vendor id dari request form
                    $vendorId = $this->input('default_vendor_id');
                    
                    // Cek ke DB: Nama (lowercase + trim) dan Supplier yang sama
                    $query = Material::whereRaw('LOWER(TRIM(name)) = ?', [strtolower(trim($value))])
                        ->where('default_vendor_id', $vendorId);

                    // KHUSUS UPDATE REQUEST: Exclude ID material yang sedang diedit
                    // (Hapus blok if ini jika Anda meletakkannya di StoreMaterialRequest)
                    if ($this->route('material')) {
                        $query->where('id', '!=', $this->route('material')->id);
                    }

                    if ($query->exists()) {
                        // Ambil nama supplier untuk pesan error dinamis
                        $supplier = Supplier::find($vendorId);
                        $supplierName = $supplier ? ($supplier->nama_perusahaan ?? $supplier->nama) : 'yang dipilih';
                        
                        $fail("Material '{$value}' dengan supplier '{$supplierName}' sudah ada.");
                    }
                }
            ],
            'category' => ['required', Rule::in(['bahan', 'aksesoris'])],
            'unit' => ['nullable', 'string', 'max:255'],
            'default_color' => ['nullable', 'string', 'max:255'],
            'default_vendor_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'default_harga_ecer' => ['nullable', 'numeric', 'min:0'],
            'default_harga_roll' => ['nullable', 'numeric', 'min:0'],
            'default_price_type' => ['required', 'in:ecer,roll'],
            'default_usage' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }
}
