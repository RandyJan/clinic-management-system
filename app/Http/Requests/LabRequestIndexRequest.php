<?php

namespace App\Http\Requests;

use App\Models\LaboratoryRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LabRequestIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', LaboratoryRequest::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(LaboratoryRequest::STATUSES)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'per_page.max' => 'The laboratory request list can show at most 100 records per page.',
            'search.max' => 'The search term may not be greater than 255 characters.',
            'status.in' => 'The selected laboratory request status is invalid.',
        ];
    }
}
