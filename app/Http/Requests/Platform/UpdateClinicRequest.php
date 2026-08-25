<?php

namespace App\Http\Requests\Platform;

use App\Models\Clinic;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClinicRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('Platform Administrator') === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'alpha_dash',
                'max:100',
                Rule::unique('clinics', 'slug')->ignore($this->route('clinic')),
            ],
            'email' => ['nullable', 'email', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(Clinic::STATUSES)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'slug.alpha_dash' => 'The clinic slug may only contain letters, numbers, dashes, and underscores.',
            'slug.unique' => 'This clinic slug is already in use.',
        ];
    }
}
