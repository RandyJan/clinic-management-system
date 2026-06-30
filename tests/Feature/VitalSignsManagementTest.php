<?php

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use App\Models\VitalSign;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('nurse can save vital signs and bmi is computed automatically', function () {
    $nurse = vitalUserWithPermissions(['vital-signs.create', 'vital-signs.view']);
    $patient = Patient::factory()->create();
    $appointment = Appointment::factory()->create([
        'patient_id' => $patient->id,
    ]);

    $this->actingAs($nurse)
        ->post(route('vital-signs.store'), [
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
            'temperature' => 37.2,
            'blood_pressure' => '120/80',
            'pulse_rate' => 82,
            'respiratory_rate' => 18,
            'oxygen_saturation' => 98,
            'height' => 170,
            'weight' => 72,
            'notes' => 'Stable before consultation.',
        ])
        ->assertRedirect(route('appointments.vital-signs.show', $appointment));

    $vitalSign = VitalSign::query()->firstOrFail();

    expect($vitalSign)
        ->patient_id->toBe($patient->id)
        ->appointment_id->toBe($appointment->id)
        ->recorded_by->toBe($nurse->id)
        ->bmi->toBe('24.91');
});

test('vital signs must match the selected appointment patient', function () {
    $nurse = vitalUserWithPermissions(['vital-signs.create']);
    $appointment = Appointment::factory()->create();
    $otherPatient = Patient::factory()->create();

    $this->actingAs($nurse)
        ->post(route('vital-signs.store'), [
            'patient_id' => $otherPatient->id,
            'appointment_id' => $appointment->id,
            'height' => 170,
            'weight' => 70,
        ])
        ->assertSessionHasErrors('patient_id');
});

test('doctor can view latest vital signs during consultation', function () {
    $doctor = Doctor::factory()->create();
    $doctor->user->givePermissionTo([
        vitalPermission('appointments.own.view'),
        vitalPermission('vital-signs.view'),
    ]);
    $appointment = Appointment::factory()->create([
        'doctor_id' => $doctor->id,
    ]);
    $vitalSign = VitalSign::factory()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $appointment->patient_id,
        'temperature' => 38.1,
        'recorded_at' => now(),
    ]);

    $this->actingAs($doctor->user)
        ->get(route('appointments.show', $appointment))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('appointments/show')
            ->where('latest_vital_signs.id', $vitalSign->id)
            ->where('latest_vital_signs.temperature', '38.1'));
});

test('patient vital signs history is available', function () {
    $actor = vitalUserWithPermissions(['vital-signs.view']);
    $patient = Patient::factory()->create();
    $appointment = Appointment::factory()->create([
        'patient_id' => $patient->id,
    ]);
    $vitalSign = VitalSign::factory()->create([
        'patient_id' => $patient->id,
        'appointment_id' => $appointment->id,
    ]);

    $this->actingAs($actor)
        ->get(route('patients.vital-signs.index', $patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('vital-signs/history')
            ->where('vital_signs.0.id', $vitalSign->id));
});

/**
 * @param  list<string>  $permissions
 */
function vitalUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permissionName) {
        vitalPermission($permissionName);
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function vitalPermission(string $name): Permission
{
    return Permission::firstOrCreate([
        'name' => $name,
        'guard_name' => 'web',
    ]);
}
