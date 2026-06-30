<?php

use App\Models\Appointment;
use App\Models\ClinicQueue;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('receptionist can create an appointment with a generated appointment number', function () {
    $actor = appointmentUserWithPermissions(['appointments.create', 'appointments.own.view']);
    $patient = Patient::factory()->create();
    $doctor = Doctor::factory()->create(['status' => 'active']);

    $this->actingAs($actor)
        ->post(route('appointments.store'), [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-06-26',
            'appointment_time' => '09:30',
            'reason_for_visit' => 'Routine consultation',
            'appointment_type' => 'Consultation',
        ])
        ->assertRedirect();

    $appointment = Appointment::query()->firstOrFail();

    expect($appointment)
        ->appointment_number->toStartWith('APT-')
        ->status->toBe(Appointment::STATUS_PENDING)
        ->created_by->toBe($actor->id);
});

test('doctor double booking is prevented', function () {
    $actor = appointmentUserWithPermissions(['appointments.create']);
    $doctor = Doctor::factory()->create(['status' => 'active']);
    Appointment::factory()->create([
        'doctor_id' => $doctor->id,
        'appointment_date' => '2026-06-26',
        'appointment_time' => '10:00',
        'status' => Appointment::STATUS_CONFIRMED,
    ]);

    $this->actingAs($actor)
        ->post(route('appointments.store'), [
            'patient_id' => Patient::factory()->create()->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-06-26',
            'appointment_time' => '10:00',
            'reason_for_visit' => 'Follow-up',
            'appointment_type' => 'Consultation',
        ])
        ->assertSessionHasErrors('appointment_time');
});

test('appointment can be rescheduled when doctor slot is available', function () {
    $actor = appointmentUserWithPermissions(['appointments.update']);
    $appointment = Appointment::factory()->create([
        'appointment_date' => '2026-06-26',
        'appointment_time' => '11:00',
    ]);

    $this->actingAs($actor)
        ->put(route('appointments.update', $appointment), [
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'appointment_date' => '2026-06-27',
            'appointment_time' => '14:00',
            'reason_for_visit' => 'Updated visit reason',
            'appointment_type' => 'Follow-up',
            'status' => Appointment::STATUS_CONFIRMED,
            'remarks' => 'Moved by request',
        ])
        ->assertRedirect(route('appointments.show', $appointment));

    expect($appointment->fresh())
        ->appointment_date->toDateString()->toBe('2026-06-27')
        ->appointment_time->format('H:i')->toBe('14:00')
        ->status->toBe(Appointment::STATUS_CONFIRMED);
});

test('appointment status updates through check in consultation and completion', function () {
    $receptionist = appointmentUserWithPermissions(['appointments.check-in']);
    $doctor = Doctor::factory()->create(['status' => 'active']);
    $doctor->user->givePermissionTo([
        appointmentPermission('appointments.manage-consultations'),
    ]);
    $appointment = Appointment::factory()->create([
        'doctor_id' => $doctor->id,
        'status' => Appointment::STATUS_CONFIRMED,
    ]);

    $this->actingAs($receptionist)
        ->patch(route('appointments.check-in', $appointment))
        ->assertRedirect();

    $queue = ClinicQueue::query()->where('appointment_id', $appointment->id)->firstOrFail();

    expect($appointment->fresh()->status)->toBe(Appointment::STATUS_CHECKED_IN)
        ->and($queue)
        ->patient_id->toBe($appointment->patient_id)
        ->doctor_id->toBe($appointment->doctor_id)
        ->status->toBe(ClinicQueue::STATUS_WAITING);

    $this->actingAs($doctor->user)
        ->patch(route('appointments.start', $appointment))
        ->assertRedirect();

    expect($appointment->fresh()->status)->toBe(Appointment::STATUS_IN_CONSULTATION)
        ->and($queue->fresh()->status)->toBe(ClinicQueue::STATUS_IN_CONSULTATION);

    $this->actingAs($doctor->user)
        ->patch(route('appointments.complete', $appointment))
        ->assertRedirect();

    expect($appointment->fresh()->status)->toBe(Appointment::STATUS_COMPLETED)
        ->and($queue->fresh()->status)->toBe(ClinicQueue::STATUS_COMPLETED);
});

test('doctor can view assigned appointments only', function () {
    $doctor = Doctor::factory()->create();
    $doctor->user->givePermissionTo(appointmentPermission('appointments.own.view'));
    $assignedAppointment = Appointment::factory()->create([
        'doctor_id' => $doctor->id,
        'appointment_date' => now()->toDateString(),
    ]);
    Appointment::factory()->create([
        'appointment_date' => now()->toDateString(),
    ]);

    $this->actingAs($doctor->user)
        ->get(route('appointments.doctor'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('appointments/index')
            ->where('appointments.data.0.id', $assignedAppointment->id)
            ->where('appointments.total', 1));
});

test('appointment list filters and calendar display appointments', function () {
    $actor = appointmentUserWithPermissions(['appointments.view', 'appointments.own.view']);
    $doctor = Doctor::factory()->create();
    $patient = Patient::factory()->create();
    $appointment = Appointment::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'appointment_date' => '2026-06-26',
        'status' => Appointment::STATUS_CONFIRMED,
    ]);
    Appointment::factory()->create([
        'appointment_date' => '2026-06-27',
    ]);

    $this->actingAs($actor)
        ->get(route('appointments.index', [
            'date' => '2026-06-26',
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'status' => Appointment::STATUS_CONFIRMED,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('appointments/index')
            ->where('appointments.data.0.id', $appointment->id)
            ->where('appointments.total', 1));

    $this->actingAs($actor)
        ->get(route('appointments.calendar', ['date' => '2026-06-26']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('appointments/calendar')
            ->where('appointments.0.id', $appointment->id));
});

/**
 * @param  list<string>  $permissions
 */
function appointmentUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permissionName) {
        appointmentPermission($permissionName);
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function appointmentPermission(string $name): Permission
{
    return Permission::firstOrCreate([
        'name' => $name,
        'guard_name' => 'web',
    ]);
}
