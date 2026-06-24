<?php

namespace App\Http\Requests;

use App\Models\Doctor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDoctorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('doctors.create') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $doctor = $this->route('doctor');
        $doctorId = $doctor instanceof Doctor ? $doctor->id : null;
        $uniqueUserRule = Rule::unique('doctors', 'user_id');
        $uniqueLicenseRule = Rule::unique('doctors', 'license_number');

        if ($doctorId !== null) {
            $uniqueUserRule->ignore($doctorId);
            $uniqueLicenseRule->ignore($doctorId);
        }

        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id'),
                $uniqueUserRule,
            ],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'specialization' => ['required', 'string', 'max:255'],
            'license_number' => [
                'required',
                'string',
                'max:255',
                $uniqueLicenseRule,
            ],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'consultation_fee' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'schedule' => ['required', 'string', 'max:5000'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'The linked user account is required.',
            'user_id.unique' => 'This user account already has a doctor profile.',
            'first_name.required' => 'The first name is required.',
            'last_name.required' => 'The last name is required.',
            'specialization.required' => 'The specialization is required.',
            'license_number.required' => 'The license number is required.',
            'license_number.unique' => 'The license number has already been taken.',
            'consultation_fee.required' => 'The consultation fee is required.',
            'consultation_fee.numeric' => 'The consultation fee must be a number.',
            'schedule.required' => 'The clinic schedule is required.',
            'email.email' => 'Enter a valid email address.',
        ];
    }
}
