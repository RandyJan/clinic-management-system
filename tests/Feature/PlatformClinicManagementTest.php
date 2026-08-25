<?php

use App\Models\Clinic;
use App\Models\User;
use Database\Seeders\TestAccountSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('platform administrator can manage clinics', function () {
    $platformAdministrator = platformAdministrator();

    $this->actingAs($platformAdministrator)
        ->get(route('platform.clinics.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('platform/clinics/index')
            ->has('clinics'));

    $this->actingAs($platformAdministrator)
        ->post(route('platform.clinics.store'), [
            'name' => 'Clinic A',
            'slug' => 'clinic-a',
            'email' => 'admin@clinic-a.test',
            'contact_number' => '09170000000',
            'address' => 'Clinic A Address',
            'status' => Clinic::STATUS_ACTIVE,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $clinic = Clinic::query()->where('slug', 'clinic-a')->firstOrFail();

    $this->actingAs($platformAdministrator)
        ->put(route('platform.clinics.update', $clinic), [
            'name' => 'Clinic A Main',
            'slug' => 'clinic-a',
            'email' => 'admin@clinic-a.test',
            'contact_number' => '09170000000',
            'address' => 'Updated address',
            'status' => Clinic::STATUS_INACTIVE,
        ])
        ->assertRedirect(route('platform.clinics.edit', $clinic))
        ->assertSessionHasNoErrors();

    expect($clinic->fresh())
        ->name->toBe('Clinic A Main')
        ->status->toBe(Clinic::STATUS_INACTIVE);
});

test('clinic administrator cannot access platform clinic management', function () {
    $administrator = User::factory()->create();
    $administrator->assignRole(Role::create([
        'name' => 'Administrator',
        'guard_name' => 'web',
    ]));

    $this->actingAs($administrator)
        ->get(route('platform.clinics.index'))
        ->assertForbidden();
});

test('clinic slug must be unique', function () {
    $platformAdministrator = platformAdministrator();
    Clinic::factory()->create(['slug' => 'clinic-a']);

    $this->actingAs($platformAdministrator)
        ->post(route('platform.clinics.store'), [
            'name' => 'Another Clinic A',
            'slug' => 'clinic-a',
            'status' => Clinic::STATUS_ACTIVE,
        ])
        ->assertSessionHasErrors(['slug']);
});

test('test account seeder creates a platform administrator', function () {
    $this->seed(TestAccountSeeder::class);

    $platformAdministrator = User::query()
        ->where('email', 'platformadmin@clinic.test')
        ->firstOrFail();

    expect($platformAdministrator)
        ->is_active->toBeTrue()
        ->and($platformAdministrator->hasRole('Platform Administrator'))->toBeTrue();
});

test('clinic administrators cannot assign the platform administrator role', function () {
    Role::create(['name' => 'Platform Administrator', 'guard_name' => 'web']);
    $administratorRole = Role::create(['name' => 'Administrator', 'guard_name' => 'web']);
    $permission = Permission::create(['name' => 'users.update', 'guard_name' => 'web']);
    $administrator = User::factory()->create();
    $targetUser = User::factory()->create();
    $administrator->assignRole($administratorRole);
    $administrator->givePermissionTo($permission);

    $this->actingAs($administrator)
        ->patch(route('users.update-role', $targetUser), [
            'role' => 'Platform Administrator',
        ])
        ->assertSessionHasErrors(['role']);

    expect($targetUser->fresh()->hasRole('Platform Administrator'))->toBeFalse();
});

function platformAdministrator(): User
{
    $role = Role::create([
        'name' => 'Platform Administrator',
        'guard_name' => 'web',
    ]);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}
