<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(['bahan', 'aksesoris'])],
            'unit' => ['nullable', 'string', 'max:255'],
            'default_supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'harga_ecer' => ['numeric', 'min:0'],
            'harga_roll' => ['numeric', 'min:0'],
            'roll_qty' => ['nullable', 'numeric', 'min:0'],
            'roll_unit' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }
}
