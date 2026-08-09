<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdatePatientRequest extends StorePatientRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('patients.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $patient = $this->route('patient');

        $rules['user_id'] = [
            'nullable',
            'integer',
            Rule::exists('users', 'id'),
            Rule::unique('patients', 'user_id')->ignore($patient instanceof Patient ? $patient->id : null),
        ];

        return $rules;
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $patient = $this->route('patient');

                if ($patient instanceof Patient && $this->hasDuplicatePatient($patient)) {
                    $validator->errors()->add(
                        'contact_number',
                        'A patient with the same name, birthdate, and contact number already exists.'
                    );
                }
            },
        ];
    }
}
