<?php

use App\Models\Clinic;
use App\Models\ClinicMembership;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('authorized users can view the user management page', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'users.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.view');

    User::factory()->create(['name' => 'Managed User']);

    $this->actingAs($actor)
        ->get(route('users.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data')
            ->has('roles'));
});

test('user management displays assigned clinics', function () {
    $actor = User::factory()->create(['name' => 'Admin Actor']);
    $managedUser = User::factory()->create(['name' => 'Clinic Member']);
    $clinic = Clinic::factory()->create(['name' => 'Clinic A']);
    $clinicRole = Role::create(['name' => 'Doctor', 'guard_name' => 'web']);
    $administratorRole = Role::create(['name' => 'Administrator', 'guard_name' => 'web']);

    ClinicMembership::query()->create([
        'clinic_id' => $clinic->id,
        'user_id' => $managedUser->id,
        'role_id' => $clinicRole->id,
        'status' => ClinicMembership::STATUS_ACTIVE,
    ]);
    ClinicMembership::query()->create([
        'clinic_id' => $clinic->id,
        'user_id' => $actor->id,
        'role_id' => $administratorRole->id,
        'status' => ClinicMembership::STATUS_ACTIVE,
    ]);

    Permission::firstOrCreate(['name' => 'users.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.view');

    $this->actingAs($actor)
        ->get(route('users.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.current_clinic.name', 'Clinic A')
            ->where('users.data.1.name', 'Clinic Member')
            ->where('users.data.1.clinics.0.name', 'Clinic A')
            ->where('users.data.1.clinics.0.role', 'Doctor')
            ->where('users.data.1.clinics.0.status', ClinicMembership::STATUS_ACTIVE));
});

test('authorized users can change a user role', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();
    $role = Role::create(['name' => 'Approver', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'users.update', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.update');

    $this->actingAs($actor)
        ->patch(route('users.update-role', $target), [
            'role' => $role->name,
        ])
        ->assertRedirect();

    expect($target->fresh()->hasRole($role))->toBeTrue();

    $this->assertDatabaseHas('activity_log', [
        'log_name' => 'user-management',
        'description' => 'Changed user role',
        'subject_id' => $target->id,
        'subject_type' => User::class,
    ]);
});

test('authorized users can activate and deactivate users', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();

    Permission::firstOrCreate(['name' => 'users.update', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.update');

    $this->actingAs($actor)
        ->patch(route('users.deactivate', $target))
        ->assertRedirect();

    expect($target->fresh()->is_active)->toBeFalse();

    $this->actingAs($actor)
        ->patch(route('users.activate', $target))
        ->assertRedirect();

    expect($target->fresh()->is_active)->toBeTrue();
});

test('clinic administrator approval activates the requested clinic membership', function () {
    $administrator = User::factory()->create();
    $pendingUser = User::factory()->inactive()->create();
    $clinic = Clinic::factory()->create();
    $administratorRole = Role::create(['name' => 'Administrator', 'guard_name' => 'web']);
    $guestRole = Role::create(['name' => 'Guest', 'guard_name' => 'web']);

    $administrator->givePermissionTo(Permission::firstOrCreate([
        'name' => 'users.update',
        'guard_name' => 'web',
    ]));
    $administrator->assignRole($administratorRole);
    $administrator->clinicMemberships()->create([
        'clinic_id' => $clinic->id,
        'role_id' => $administratorRole->id,
        'status' => ClinicMembership::STATUS_ACTIVE,
    ]);
    $membership = $pendingUser->clinicMemberships()->create([
        'clinic_id' => $clinic->id,
        'role_id' => $guestRole->id,
        'status' => ClinicMembership::STATUS_PENDING,
    ]);

    $this->actingAs($administrator)
        ->patch(route('users.activate', $pendingUser))
        ->assertRedirect();

    expect($pendingUser->fresh()->is_active)->toBeTrue()
        ->and($membership->fresh()->status)->toBe(ClinicMembership::STATUS_ACTIVE);
});

test('super administrator can approve a user from another clinic', function () {
    $superAdministrator = User::factory()->create();
    $pendingUser = User::factory()->inactive()->create();
    $clinic = Clinic::factory()->create();
    $superRole = Role::create(['name' => 'Super Administrator', 'guard_name' => 'web']);
    $patientRole = Role::create(['name' => 'Patient', 'guard_name' => 'web']);

    $superAdministrator->assignRole($superRole);
    $superAdministrator->givePermissionTo(Permission::firstOrCreate([
        'name' => 'users.update',
        'guard_name' => 'web',
    ]));
    $membership = $pendingUser->clinicMemberships()->create([
        'clinic_id' => $clinic->id,
        'role_id' => $patientRole->id,
        'status' => ClinicMembership::STATUS_PENDING,
    ]);

    $this->actingAs($superAdministrator)
        ->patch(route('users.activate', $pendingUser))
        ->assertRedirect();

    expect($pendingUser->fresh()->is_active)->toBeTrue()
        ->and($membership->fresh()->status)->toBe(ClinicMembership::STATUS_ACTIVE);
});

test('users cannot deactivate their own account', function () {
    $actor = User::factory()->create();

    Permission::firstOrCreate(['name' => 'users.update', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.update');

    $this->actingAs($actor)
        ->patch(route('users.deactivate', $actor))
        ->assertSessionHasErrors('user');

    expect($actor->fresh()->is_active)->toBeTrue();
});

test('inactive authenticated users are signed out on the next request', function () {
    $user = User::factory()->inactive()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});
