<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('consultations.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'chief_complaint' => ['required', 'string', 'max:2000'],
            'history_of_present_illness' => ['nullable', 'string', 'max:4000'],
            'diagnosis' => ['nullable', 'string', 'max:4000'],
            'treatment_plan' => ['nullable', 'string', 'max:4000'],
            'doctor_notes' => ['nullable', 'string', 'max:4000'],
            'follow_up_date' => ['nullable', 'date'],
            'prescription_medications' => ['nullable', 'string', 'max:4000'],
            'prescription_instructions' => ['nullable', 'string', 'max:4000'],
            'laboratory_tests' => ['nullable', 'string', 'max:4000'],
            'laboratory_instructions' => ['nullable', 'string', 'max:4000'],
        ];
    }
}
