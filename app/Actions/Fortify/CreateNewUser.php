<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Notifications\ClinicEventNotification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
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
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'username' => str($input['username'])->lower()->toString(),
            'email' => $input['email'],
            'password' => $input['password'],
            'is_active' => false,
        ]);

        User::query()
            ->role('Administrator')
            ->where('is_active', true)
            ->get()
            ->each(fn (User $administrator) => $administrator->notify(new ClinicEventNotification(
                'New account pending approval',
                "{$user->name} registered an account and is waiting for admin approval.",
                ClinicEventNotification::TYPE_SYSTEM,
                route('users.index', ['status' => 'inactive', 'search' => $user->username]),
                User::class,
                $user->id,
            )));

        return $user;
    }
}
