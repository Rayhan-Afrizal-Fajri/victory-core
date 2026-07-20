<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaterialRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(['bahan', 'aksesoris'])],
            'unit' => ['nullable', 'string', 'max:255'],
            'default_color' => ['nullable', 'string', 'max:255'],
            'default_vendor_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'default_harga_ecer' => [
                
                'nullable',
                'numeric',
                'min:0',
            ],
            'default_harga_roll' => [
                
                'nullable',
                'numeric',
                'min:0',
            ],
            'default_price_type' => ['required', 'in:ecer,roll'], //ecer or roll
            'default_usage' => ['nullable', 'numeric', 'min:0'], //usage per item product/article
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }
}
