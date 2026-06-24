<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePatientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('patients.create') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->patientRules(),
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                if ($this->hasDuplicatePatient()) {
                    $validator->errors()->add(
                        'contact_number',
                        'A patient with the same name, birthdate, and contact number already exists.'
                    );
                }
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'The first name is required.',
            'last_name.required' => 'The last name is required.',
            'gender.required' => 'The gender is required.',
            'birthdate.required' => 'The birthdate is required.',
            'contact_number.required' => 'The contact number is required.',
            'address.required' => 'The address is required.',
            'email.email' => 'Enter a valid email address.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function patientRules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'gender' => ['required', Rule::in(['female', 'male', 'other'])],
            'birthdate' => ['required', 'date', 'before_or_equal:today'],
            'civil_status' => ['nullable', Rule::in(['single', 'married', 'widowed', 'separated'])],
            'contact_number' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['required', 'string', 'max:5000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_number' => ['nullable', 'string', 'max:50'],
            'blood_type' => ['nullable', Rule::in(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])],
            'allergies' => ['nullable', 'string', 'max:5000'],
            'existing_conditions' => ['nullable', 'string', 'max:5000'],
        ];
    }

    protected function hasDuplicatePatient(?Patient $ignorePatient = null): bool
    {
        if (! $this->filled(['first_name', 'last_name', 'birthdate', 'contact_number'])) {
            return false;
        }

        return Patient::query()
            ->when($ignorePatient, fn ($query) => $query->whereKeyNot($ignorePatient->getKey()))
            ->where('first_name', $this->string('first_name')->trim())
            ->where('last_name', $this->string('last_name')->trim())
            ->whereDate('birthdate', (string) $this->input('birthdate'))
            ->where('contact_number', $this->string('contact_number')->trim())
            ->exists();
    }
}
