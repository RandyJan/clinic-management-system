<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientPortalAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) config('clinic.patient_portal_enabled')
            && ($this->user()?->can('appointments.request') ?? false)
            && $this->user()?->patient()->where('status', 'active')->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')->where('status', 'active')],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
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
            'doctor_id.required' => 'Please choose a doctor.',
            'doctor_id.exists' => 'Please choose an active doctor.',
            'appointment_date.required' => 'The preferred appointment date is required.',
            'appointment_date.after_or_equal' => 'The appointment date cannot be in the past.',
            'appointment_time.required' => 'The preferred appointment time is required.',
            'reason_for_visit.required' => 'The reason for visit is required.',
            'appointment_type.required' => 'The appointment type is required.',
        ];
    }
}
