<?php

namespace App\Http\Requests;

use App\Models\Medicine;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MedicineIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('medicines.view') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Medicine::STATUSES)],
            'expiry_status' => ['nullable', Rule::in(['near-expiry', 'expired'])],
        ];
    }
}
