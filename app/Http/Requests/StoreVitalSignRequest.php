<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVitalSignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('vital-signs.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', Rule::exists('patients', 'id')],
            'appointment_id' => ['required', 'integer', Rule::exists('appointments', 'id')],
            'temperature' => ['nullable', 'numeric', 'min:30', 'max:45'],
            'blood_pressure' => ['nullable', 'string', 'max:20'],
            'pulse_rate' => ['nullable', 'numeric', 'min:20', 'max:250'],
            'respiratory_rate' => ['nullable', 'numeric', 'min:5', 'max:80'],
            'oxygen_saturation' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'height' => ['nullable', 'numeric', 'min:30', 'max:250'],
            'weight' => ['nullable', 'numeric', 'min:1', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'recorded_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'The patient is required.',
            'appointment_id.required' => 'The appointment is required.',
        ];
    }
}
