<?php

namespace App\Http\Requests\Platform;

use App\Models\Clinic;
use App\Models\ClinicMembership;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreClinicMembershipRequest extends FormRequest
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
        $clinic = $this->route('clinic');
        $clinicId = $clinic instanceof Clinic ? $clinic->getKey() : $clinic;

        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where('is_active', true),
                Rule::unique('clinic_user', 'user_id')->where('clinic_id', $clinicId),
            ],
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

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $user = User::query()->find($this->integer('user_id'));

            if ($user?->hasRole('Platform Administrator')) {
                $validator->errors()->add('user_id', 'Platform administrators cannot be clinic members.');
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['user_id.unique' => 'This user already belongs to the clinic.'];
    }
}
