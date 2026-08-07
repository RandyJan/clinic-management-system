<?php

namespace App\Http\Requests;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreMedicalCertificateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $consultation = Consultation::query()->find($this->integer('consultation_id'));

        return $consultation !== null && ($this->user()?->can('createMedicalCertificate', $consultation) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', Rule::exists((new Patient)->getTable(), 'id')],
            'consultation_id' => ['required', 'integer', Rule::exists((new Consultation)->getTable(), 'id')],
            'doctor_id' => ['required', 'integer', Rule::exists((new Doctor)->getTable(), 'id')],
            'diagnosis' => ['required', 'string', 'max:5000'],
            'recommendation' => ['required', 'string', 'max:5000'],
            'rest_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'issued_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $consultation = Consultation::query()->find($this->integer('consultation_id'));

            if ($consultation === null) {
                return;
            }

            if ($consultation->patient_id !== $this->integer('patient_id')) {
                $validator->errors()->add('patient_id', 'The patient does not match the consultation.');
            }

            if ($consultation->doctor_id !== $this->integer('doctor_id')) {
                $validator->errors()->add('doctor_id', 'The doctor does not match the consultation.');
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'The patient is required.',
            'consultation_id.required' => 'The consultation is required.',
            'doctor_id.required' => 'The doctor is required.',
            'diagnosis.required' => 'The diagnosis is required.',
            'recommendation.required' => 'The recommendation is required.',
            'issued_date.required' => 'The issued date is required.',
        ];
    }
}
