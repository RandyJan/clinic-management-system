<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQueueCheckInRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('queues.check-in') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'appointment_id' => ['nullable', 'integer', Rule::exists('appointments', 'id')],
            'patient_id' => ['required', 'integer', Rule::exists('patients', 'id')],
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')],
            'queue_date' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'The patient is required.',
            'doctor_id.required' => 'The doctor is required.',
        ];
    }
}
