<?php

namespace App\Http\Requests;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Medicine;
use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $consultation = Consultation::query()->find($this->integer('consultation_id'));

        return $consultation !== null && ($this->user()?->can('createPrescription', $consultation) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'consultation_id' => ['required', 'integer', Rule::exists((new Consultation)->getTable(), 'id')],
            'patient_id' => ['required', 'integer', Rule::exists((new Patient)->getTable(), 'id')],
            'doctor_id' => ['required', 'integer', Rule::exists((new Doctor)->getTable(), 'id')],
            'notes' => ['nullable', 'string', 'max:4000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*' => ['array:medicine_id,medicine_name,dosage,frequency,duration,quantity,instructions'],
            'items.*.medicine_id' => ['nullable', 'integer', Rule::exists((new Medicine)->getTable(), 'id')->where('is_active', true)],
            'items.*.medicine_name' => ['nullable', 'required_without:items.*.medicine_id', 'string', 'max:255'],
            'items.*.dosage' => ['required', 'string', 'max:255'],
            'items.*.frequency' => ['required', 'string', 'max:255'],
            'items.*.duration' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'items.*.instructions' => ['nullable', 'string', 'max:1000'],
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
            'items.required' => 'Add at least one prescription item.',
            'items.min' => 'Add at least one prescription item.',
            'items.*.medicine_name.required_without' => 'Enter a custom medicine name or select an inventory medicine.',
            'items.*.dosage.required' => 'The dosage is required for every medicine.',
            'items.*.frequency.required' => 'The frequency is required for every medicine.',
            'items.*.duration.required' => 'The duration is required for every medicine.',
            'items.*.quantity.required' => 'The quantity is required for every medicine.',
            'items.*.quantity.integer' => 'The quantity must be a whole number.',
            'items.*.quantity.min' => 'The quantity must be at least 1.',
        ];
    }
}
