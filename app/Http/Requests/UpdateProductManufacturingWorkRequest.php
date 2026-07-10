<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductManufacturingWorkRequest extends FormRequest
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
            'manufacturing_work_id' => ['required', 'integer', 'exists:manufacturing_works,id'],
            'default_usage' => ['required', 'numeric', 'min:0'],
            'default_unit' => ['nullable', 'string', 'max:255'],
            'usage_note' => ['nullable', 'string'],
            'max_estimate' => ['nullable', 'integer'],
            'sort_order' => ['nullable', 'integer'],
            'is_required' => ['boolean'],
        ];
    }
}
