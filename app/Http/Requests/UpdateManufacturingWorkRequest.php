<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateManufacturingWorkRequest extends FormRequest
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
            'default_unit' => ['nullable', 'string', 'max:255'],
            'default_vendor_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'default_min_estimate' => ['numeric', 'min:0'],
            'default_max_estimate' => ['numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
