<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('active users can log in with local credentials', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'username' => 'clinic_user',
        'password' => Hash::make('Password123!'),
        'is_active' => true,
    ]);

    $this->post(route('login.store'), [
        'username' => $user->username,
        'password' => 'Password123!',
    ])
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

test('users cannot log in with an invalid local password', function () {
    $user = User::factory()->withoutTwoFactor()->create([
        'username' => 'clinic_user',
        'password' => Hash::make('Password123!'),
        'is_active' => true,
    ]);

    $this->post(route('login.store'), [
        'username' => $user->username,
        'password' => 'incorrect-password',
    ])->assertSessionHasErrors(['username']);

    $this->assertGuest();
});

test('platform administrators are redirected to clinic management after login', function () {
    $role = Role::create([
        'name' => 'Platform Administrator',
        'guard_name' => 'web',
    ]);
    $user = User::factory()->withoutTwoFactor()->create([
        'username' => 'platform-admin',
        'password' => Hash::make('password'),
        'is_active' => true,
    ]);
    $user->assignRole($role);

    $this->post(route('login.store'), [
        'username' => 'platform-admin',
        'password' => 'password',
    ])->assertRedirect(route('platform.clinics.index'));

    $this->assertAuthenticatedAs($user);
});

test('authenticated users can update their local password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $this->actingAs($user)
        ->put(route('user-password.update'), [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertSessionHasNoErrors();

    expect(Hash::check('NewPassword123!', $user->fresh()->password))->toBeTrue();
});

test('password reset request screen is available', function () {
    $this->get(route('password.request'))->assertSuccessful();
});
