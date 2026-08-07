<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('services.view') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', Rule::in(Service::CATEGORIES)],
            'status' => ['nullable', Rule::in(Service::STATUSES)],
        ];
    }
}
