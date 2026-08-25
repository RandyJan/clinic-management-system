<?php

use App\Models\User;
use App\Services\RoleManagementService;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\TestAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\seed;

uses(RefreshDatabase::class);

test('database seeder creates administrator and guest demo accounts with permissions', function () {
    seed(DatabaseSeeder::class);

    /** @var User $administrator */
    $administrator = User::factory()->create();
    /** @var User $guest */
    $guest = User::factory()->create();

    $administrator->assignRole('Administrator');
    $guest->assignRole('Guest');

    expect($administrator->hasRole('Administrator'))->toBeTrue()
        ->and($guest->hasRole('Guest'))->toBeTrue()
        ->and($administrator->can('dashboard.view'))->toBeTrue()
        ->and($guest->can('dashboard.view'))->toBeTrue()
        ->and($guest->can('users.view'))->toBeFalse();

    $administratorRole = Role::findByName('Administrator');
    $guestRole = Role::findByName('Guest');

    expect($administratorRole->permissions->pluck('name')->sort()->values()->all())->toBe(
        collect(RoleManagementService::DEFAULT_PERMISSIONS)
            ->reject(fn (string $permission) => $permission === 'users.delete')
            ->sort()->values()->all()
    )->and($guestRole->permissions->pluck('name')->all())->toBe([
        'dashboard.view',
    ]);
});

test('seeded guest users can access the dashboard', function () {
    seed(DatabaseSeeder::class);

    /** @var User $guest */
    $guest = User::factory()->create();
    $guest->assignRole('Guest');

    actingAs($guest)
        ->get(route('dashboard'))
        ->assertSuccessful();
});

test('users without the dashboard permission are forbidden from the dashboard', function () {
    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('dashboard'))
        ->assertForbidden();
});

test('test account seeder creates one active account for each role', function () {
    seed(TestAccountSeeder::class);

    $accounts = [
        'super-admin' => 'Super Administrator',
        'admin' => 'Administrator',
        'receptionist' => 'Receptionist',
        'doctor' => 'Doctor',
        'nurse' => 'Nurse',
        'cashier' => 'Cashier',
        'pharmacist' => 'Pharmacist',
        'patient' => 'Patient',
        'guest' => 'Guest',
    ];

    foreach ($accounts as $username => $roleName) {
        $user = User::query()->where('username', $username)->firstOrFail();

        expect($user->is_active)->toBeTrue()
            ->and($user->hasRole($roleName))->toBeTrue()
            ->and($user->email_verified_at)->not->toBeNull();
    }

    expect(User::query()->where('username', 'doctor')->firstOrFail()->doctor)->not->toBeNull()
        ->and(User::query()->where('username', 'patient')->firstOrFail()->patient)->not->toBeNull();
});
