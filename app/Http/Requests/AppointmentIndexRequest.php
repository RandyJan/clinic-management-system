<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AppointmentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return ($this->user()?->can('appointments.view') || $this->user()?->can('appointments.own.view')) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'date' => ['nullable', 'date'],
            'doctor_id' => ['nullable', 'integer', Rule::exists('doctors', 'id')],
            'patient_id' => ['nullable', 'integer', Rule::exists('patients', 'id')],
            'status' => ['nullable', Rule::in(Appointment::STATUSES)],
        ];
    }
}
