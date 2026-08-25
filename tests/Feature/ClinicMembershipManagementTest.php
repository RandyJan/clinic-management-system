<?php

use App\Models\Clinic;
use App\Models\ClinicMembership;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('platform administrator can manage clinic memberships', function () {
    $platformAdministrator = membershipPlatformAdministrator();
    $clinic = Clinic::factory()->create();
    $clinicRole = Role::create(['name' => 'Administrator', 'guard_name' => 'web']);
    $member = User::factory()->create();

    $this->actingAs($platformAdministrator)
        ->get(route('platform.clinics.members.index', $clinic))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('platform/clinics/members')
            ->where('managedClinic.id', $clinic->id));

    $this->actingAs($platformAdministrator)
        ->post(route('platform.clinics.members.store', $clinic), [
            'user_id' => $member->id,
            'role_id' => $clinicRole->id,
            'status' => ClinicMembership::STATUS_ACTIVE,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $membership = ClinicMembership::query()->firstOrFail();

    expect($membership)
        ->clinic_id->toBe($clinic->id)
        ->user_id->toBe($member->id)
        ->role_id->toBe($clinicRole->id);

    $this->actingAs($platformAdministrator)
        ->patch(route('platform.clinics.members.update', [$clinic, $membership]), [
            'role_id' => $clinicRole->id,
            'status' => ClinicMembership::STATUS_INACTIVE,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($membership->fresh()->status)->toBe(ClinicMembership::STATUS_INACTIVE);
});

test('membership cannot be updated through another clinic', function () {
    $platformAdministrator = membershipPlatformAdministrator();
    $clinicA = Clinic::factory()->create();
    $clinicB = Clinic::factory()->create();
    $role = Role::create(['name' => 'Doctor', 'guard_name' => 'web']);
    $membership = ClinicMembership::query()->create([
        'clinic_id' => $clinicB->id,
        'user_id' => User::factory()->create()->id,
        'role_id' => $role->id,
        'status' => ClinicMembership::STATUS_ACTIVE,
    ]);

    $this->actingAs($platformAdministrator)
        ->patch(route('platform.clinics.members.update', [$clinicA, $membership]), [
            'role_id' => $role->id,
            'status' => ClinicMembership::STATUS_INACTIVE,
        ])
        ->assertNotFound();
});

test('platform administrators cannot be assigned to clinics', function () {
    $platformAdministrator = membershipPlatformAdministrator();
    $clinic = Clinic::factory()->create();
    $clinicRole = Role::create(['name' => 'Administrator', 'guard_name' => 'web']);

    $this->actingAs($platformAdministrator)
        ->post(route('platform.clinics.members.store', $clinic), [
            'user_id' => $platformAdministrator->id,
            'role_id' => $clinicRole->id,
            'status' => ClinicMembership::STATUS_ACTIVE,
        ])
        ->assertSessionHasErrors(['user_id']);
});

function membershipPlatformAdministrator(): User
{
    $role = Role::create(['name' => 'Platform Administrator', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}
