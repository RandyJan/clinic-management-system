<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return ($this->user()?->can('appointments.create') || $this->user()?->can('appointments.request')) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', Rule::exists('patients', 'id')],
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required', 'date_format:H:i'],
            'reason_for_visit' => ['required', 'string', 'max:255'],
            'appointment_type' => ['required', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:2000'],
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
            'appointment_date.required' => 'The appointment date is required.',
            'appointment_time.required' => 'The appointment time is required.',
            'reason_for_visit.required' => 'The reason for visit is required.',
            'appointment_type.required' => 'The appointment type is required.',
        ];
    }
}
