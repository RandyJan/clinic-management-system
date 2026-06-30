<?php

namespace App\Http\Requests;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreLabRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $consultation = Consultation::query()->find($this->integer('consultation_id'));

        return $consultation !== null && ($this->user()?->can('createLabRequest', $consultation) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'consultation_id' => ['required', 'integer', Rule::exists((new Consultation)->getTable(), 'id')],
            'patient_id' => ['required', 'integer', Rule::exists((new Patient)->getTable(), 'id')],
            'doctor_id' => ['required', 'integer', Rule::exists((new Doctor)->getTable(), 'id')],
            'requested_tests' => ['required', 'array', 'min:1'],
            'requested_tests.*' => ['required', 'string', 'distinct', 'max:255'],
            'clinical_notes' => ['nullable', 'string', 'max:4000'],
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
            'consultation_id.required' => 'The consultation is required.',
            'patient_id.required' => 'The patient is required.',
            'doctor_id.required' => 'The doctor is required.',
            'requested_tests.required' => 'Add at least one requested test.',
            'requested_tests.min' => 'Add at least one requested test.',
            'requested_tests.*.required' => 'Each requested test must have a name.',
            'requested_tests.*.distinct' => 'Each requested test must be unique.',
        ];
    }
}
