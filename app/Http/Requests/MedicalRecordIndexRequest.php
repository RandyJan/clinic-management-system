<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;

class MedicalRecordIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAnyMedicalRecords', Patient::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'per_page.max' => 'The medical record list can show at most 100 records per page.',
            'search.max' => 'The search term may not be greater than 255 characters.',
        ];
    }
}
