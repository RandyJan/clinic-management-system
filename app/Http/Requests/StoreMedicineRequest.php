<?php

namespace App\Http\Requests;

use App\Models\Medicine;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedicineRequest extends FormRequest
{
    public function authorize(): bool
    {
        $medicine = $this->route('medicine');

        if ($medicine instanceof Medicine) {
            return $this->user()?->can('medicines.update') ?? false;
        }

        return $this->user()?->can('medicines.create') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'generic_name' => ['nullable', 'string', 'max:255'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'dosage_form' => ['nullable', 'string', 'max:255'],
            'strength' => ['nullable', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:50'],
            'current_stock' => [$this->route('medicine') instanceof Medicine ? 'nullable' : 'required', 'numeric', 'min:0', 'max:1000000000'],
            'reorder_level' => ['required', 'numeric', 'min:0', 'max:1000000000'],
            'expiry_date' => ['nullable', 'date'],
            'selling_price' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'cost_price' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'status' => ['nullable', Rule::in(Medicine::STATUSES)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'The medicine name is required.',
            'category.required' => 'The medicine category is required.',
            'unit.required' => 'The medicine unit is required.',
            'current_stock.required' => 'The current stock is required.',
            'current_stock.numeric' => 'The current stock must be numeric.',
            'reorder_level.required' => 'The reorder level is required.',
            'reorder_level.numeric' => 'The reorder level must be numeric.',
            'selling_price.required' => 'The selling price is required.',
            'selling_price.numeric' => 'The selling price must be numeric.',
        ];
    }
}
