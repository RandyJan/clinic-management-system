<?php

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config(['clinic.patient_portal_enabled' => true]);
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('patient can request an appointment for their own linked patient profile', function () {
    $user = patientPortalUser(['appointments.request']);
    $patient = Patient::factory()->create(['user_id' => $user->id]);
    $otherPatient = Patient::factory()->create();
    $doctor = Doctor::factory()->create(['status' => 'active']);

    $this->actingAs($user)
        ->post(route('patient-portal.appointments.store'), [
            'patient_id' => $otherPatient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => '09:30',
            'reason_for_visit' => 'Routine consultation',
            'appointment_type' => 'Consultation',
        ])
        ->assertRedirect(route('patient-portal.appointments'));

    $appointment = Appointment::query()->firstOrFail();

    expect($appointment)
        ->patient_id->toBe($patient->id)
        ->doctor_id->toBe($doctor->id)
        ->status->toBe(Appointment::STATUS_PENDING)
        ->created_by->toBe($user->id);
});

test('patient portal appointment history only includes own appointments', function () {
    $user = patientPortalUser(['appointments.own.view']);
    $patient = Patient::factory()->create(['user_id' => $user->id]);
    $ownAppointment = Appointment::factory()->create(['patient_id' => $patient->id]);
    Appointment::factory()->create();

    $this->actingAs($user)
        ->get(route('patient-portal.appointments'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patient-portal/appointments')
            ->where('appointments.total', 1)
            ->where('appointments.data.0.id', $ownAppointment->id));
});

test('unlinked users cannot access patient portal records', function () {
    $user = patientPortalUser(['appointments.own.view']);

    $this->actingAs($user)
        ->get(route('patient-portal.appointments'))
        ->assertForbidden();
});

test('administrators cannot access patient portal modules', function () {
    $administrator = User::factory()->create(['is_active' => true]);
    $administratorRole = Role::firstOrCreate([
        'name' => 'Administrator',
        'guard_name' => 'web',
    ]);
    $portalPermission = Permission::firstOrCreate([
        'name' => 'appointments.own.view',
        'guard_name' => 'web',
    ]);

    $administratorRole->givePermissionTo($portalPermission);
    $administrator->assignRole($administratorRole);

    $this->actingAs($administrator)
        ->get(route('patient-portal.appointments'))
        ->assertForbidden();
});

/**
 * @param  list<string>  $permissions
 */
function patientPortalUser(array $permissions): User
{
    $user = User::factory()->create(['is_active' => true]);
    $patientRole = Role::firstOrCreate([
        'name' => 'Patient',
        'guard_name' => 'web',
    ]);

    foreach ($permissions as $permissionName) {
        Permission::firstOrCreate([
            'name' => $permissionName,
            'guard_name' => 'web',
        ]);
    }

    $user->givePermissionTo($permissions);
    $user->assignRole($patientRole);

    return $user;
}
