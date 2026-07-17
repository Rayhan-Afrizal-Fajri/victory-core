<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductMaterialRequest extends FormRequest
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
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'material_id' => ['required', 'integer', 'exists:materials,id'],
            'default_supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'type' => ['required', Rule::in(['bahan', 'aksesoris'])],
            'default_usage' => ['required', 'numeric', 'min:0'],
            'default_unit' => ['nullable', 'string', 'max:255'],
            'harga_ecer' => ['nullable', 'integer'],
            'harga_roll' => ['nullable', 'integer'],
            'sort_order' => ['nullable', 'integer'],
            'is_required' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
