<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $service = $this->route('service');

        if ($service instanceof Service) {
            return $this->user()?->can('services.update') ?? false;
        }

        return $this->user()?->can('services.create') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'category' => ['required', Rule::in(Service::CATEGORIES)],
            'price' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'status' => ['nullable', Rule::in(Service::STATUSES)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'The service name is required.',
            'category.required' => 'The service category is required.',
            'category.in' => 'The selected service category is invalid.',
            'price.required' => 'The service price is required.',
            'price.numeric' => 'The service price must be numeric.',
        ];
    }
}
