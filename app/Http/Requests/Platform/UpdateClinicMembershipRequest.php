<?php

namespace App\Http\Requests\Platform;

use App\Models\ClinicMembership;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClinicMembershipRequest extends FormRequest
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
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where(fn ($query) => $query
                    ->where('guard_name', 'web')
                    ->where('name', '!=', 'Platform Administrator')),
            ],
            'status' => ['required', Rule::in(ClinicMembership::STATUSES)],
        ];
    }
}
