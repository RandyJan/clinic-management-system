<?php

namespace App\Http\Requests;

use App\Models\Prescription;
use Illuminate\Foundation\Http\FormRequest;

class DispensePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $prescription = $this->route('prescription');

        return $prescription instanceof Prescription
            && ($this->user()?->can('dispense', $prescription) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [];
    }
}
