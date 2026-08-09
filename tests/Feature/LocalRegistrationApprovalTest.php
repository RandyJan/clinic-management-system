<?php

use App\Models\User;
use App\Services\TurnstileService;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('users can register local accounts that require admin approval', function () {
    $this->seed(RbacSeeder::class);

    $this->post(route('register.store'), [
        'name' => 'Pending User',
        'username' => 'pending_user',
        'email' => 'pending@example.test',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])
        ->assertRedirect(route('login'))
        ->assertSessionHas('status', 'Your account has been created and is pending administrator approval.');

    $user = User::query()->where('username', 'pending_user')->firstOrFail();

    expect($user)
        ->name->toBe('Pending User')
        ->email->toBe('pending@example.test')
        ->is_active->toBeFalse()
        ->and(Hash::check('Password123!', $user->password))->toBeTrue()
        ->and(auth()->check())->toBeFalse();
});

test('pending local accounts cannot log in until approved', function () {
    app()->instance(TurnstileService::class, new class extends TurnstileService
    {
        public function validate(string $token, ?string $remoteIp = null): bool
        {
            return true;
        }
    });

    $user = User::factory()->create([
        'username' => 'pending_user',
        'email' => 'pending@example.test',
        'password' => Hash::make('Password123!'),
        'is_active' => false,
    ]);

    $this->post(route('login.store'), [
        'samaccountname' => $user->username,
        'password' => 'Password123!',
        'cf-turnstile-response' => 'test-token',
    ])->assertSessionHasErrors(['samaccountname']);
});
