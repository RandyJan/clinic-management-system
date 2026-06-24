<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QueueIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('queues.view') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:255'],
            'doctor_id' => ['nullable', 'integer', Rule::exists('doctors', 'id')],
            'queue_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in([
                'Waiting',
                'Called',
                'In Consultation',
                'Completed',
                'Skipped',
                'Cancelled',
            ])],
        ];
    }
}
