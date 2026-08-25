<?php

namespace App\Actions\Fortify;

use App\Models\Clinic;
use App\Models\ClinicMembership;
use App\Models\User;
use App\Notifications\ClinicEventNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:255',
                'alpha_dash:ascii',
                Rule::unique(User::class),
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'clinic_id' => [
                'required',
                'integer',
                Rule::exists(Clinic::class, 'id')->where('status', Clinic::STATUS_ACTIVE),
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        $clinic = Clinic::query()->findOrFail($input['clinic_id']);
        $patientRole = Role::findByName('Patient', 'web');

        $user = DB::transaction(function () use ($input, $clinic, $patientRole): User {
            $user = User::create([
                'name' => $input['name'],
                'username' => str($input['username'])->lower()->toString(),
                'email' => $input['email'],
                'password' => $input['password'],
                'is_active' => false,
            ]);

            $user->assignRole($patientRole);
            $user->clinicMemberships()->create([
                'clinic_id' => $clinic->id,
                'role_id' => $patientRole->id,
                'status' => ClinicMembership::STATUS_PENDING,
            ]);

            return $user;
        });

        User::query()
            ->role('Administrator')
            ->where('is_active', true)
            ->whereHas('clinicMemberships', fn ($query) => $query
                ->where('clinic_id', $clinic->id)
                ->where('status', ClinicMembership::STATUS_ACTIVE)
                ->whereHas('role', fn ($roleQuery) => $roleQuery->where('name', 'Administrator')))
            ->get()
            ->each(fn (User $administrator) => $administrator->notify(new ClinicEventNotification(
                'New account pending approval',
                "{$user->name} requested access to {$clinic->name} and is waiting for approval.",
                ClinicEventNotification::TYPE_SYSTEM,
                route('users.index', ['status' => 'inactive', 'search' => $user->username]),
                User::class,
                $user->id,
            )));

        return $user;
    }
}
