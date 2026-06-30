<?php

use App\Events\QueueUpdated;
use App\Models\Appointment;
use App\Models\ClinicQueue;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('receptionist can check in patients and daily queue numbers increment', function () {
    Event::fake([QueueUpdated::class]);
    $actor = userWithPermissions(['queues.check-in', 'queues.view']);
    $doctor = Doctor::factory()->create(['status' => 'active']);
    $firstPatient = Patient::factory()->create();
    $secondPatient = Patient::factory()->create();

    $this->actingAs($actor)
        ->post(route('queues.store'), [
            'patient_id' => $firstPatient->id,
            'doctor_id' => $doctor->id,
            'queue_date' => '2026-06-24',
        ])
        ->assertRedirect(route('queues.index', ['queue_date' => '2026-06-24']));

    $this->actingAs($actor)
        ->post(route('queues.store'), [
            'patient_id' => $secondPatient->id,
            'doctor_id' => $doctor->id,
            'queue_date' => '2026-06-24',
        ])
        ->assertRedirect(route('queues.index', ['queue_date' => '2026-06-24']));

    expect(ClinicQueue::query()->orderBy('id')->pluck('queue_number')->all())
        ->toBe(['Q-001', 'Q-002']);

    Event::assertDispatched(QueueUpdated::class, 2);
});

test('inactive doctors cannot receive check ins', function () {
    $actor = userWithPermissions(['queues.check-in']);
    $doctor = Doctor::factory()->inactive()->create();
    $patient = Patient::factory()->create();

    $this->actingAs($actor)
        ->post(route('queues.store'), [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ])
        ->assertSessionHasErrors('doctor_id');
});

test('checked in patients appear in queue list', function () {
    $actor = userWithPermissions(['queues.view']);
    $queue = ClinicQueue::factory()->create([
        'queue_number' => 'Q-001',
        'queue_date' => now()->toDateString(),
    ]);

    $this->actingAs($actor)
        ->get(route('queues.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('queues/index')
            ->where('queues.data.0.id', $queue->id)
            ->where('active_queues.0.queue_number', 'Q-001'));
});

test('receptionist can check in an appointment and sync appointment status', function () {
    Event::fake([QueueUpdated::class]);
    $actor = userWithPermissions(['queues.check-in', 'queues.view']);
    $appointment = Appointment::factory()->create([
        'appointment_date' => '2026-06-24',
        'status' => Appointment::STATUS_CONFIRMED,
    ]);

    $this->actingAs($actor)
        ->post(route('queues.store'), [
            'appointment_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'queue_date' => '2026-06-24',
        ])
        ->assertRedirect(route('queues.index', ['queue_date' => '2026-06-24']));

    $queue = ClinicQueue::query()->firstOrFail();

    expect($queue)
        ->appointment_id->toBe($appointment->id)
        ->patient_id->toBe($appointment->patient_id)
        ->doctor_id->toBe($appointment->doctor_id)
        ->status->toBe(ClinicQueue::STATUS_WAITING)
        ->and($appointment->fresh()->status)->toBe(Appointment::STATUS_CHECKED_IN);

    Event::assertDispatched(QueueUpdated::class);
});

test('queue status updates keep linked appointment in sync', function () {
    $actor = userWithPermissions(['queues.call', 'queues.view']);
    $appointment = Appointment::factory()->create([
        'status' => Appointment::STATUS_CHECKED_IN,
    ]);
    $queue = ClinicQueue::factory()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $appointment->patient_id,
        'doctor_id' => $appointment->doctor_id,
        'status' => ClinicQueue::STATUS_WAITING,
    ]);

    $this->actingAs($actor)
        ->patch(route('queues.start', $queue))
        ->assertRedirect();

    expect($appointment->fresh()->status)->toBe(Appointment::STATUS_IN_CONSULTATION);

    $this->actingAs($actor)
        ->patch(route('queues.complete', $queue))
        ->assertRedirect();

    expect($appointment->fresh()->status)->toBe(Appointment::STATUS_COMPLETED);
});

test('queue check in page includes todays eligible appointments', function () {
    $actor = userWithPermissions(['queues.check-in']);
    $appointment = Appointment::factory()->create([
        'appointment_date' => now()->toDateString(),
        'status' => Appointment::STATUS_CONFIRMED,
    ]);
    Appointment::factory()->create([
        'appointment_date' => now()->addDay()->toDateString(),
        'status' => Appointment::STATUS_CONFIRMED,
    ]);

    $this->actingAs($actor)
        ->get(route('queues.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('queues/check-in')
            ->where('appointments.0.id', $appointment->id)
            ->where('appointments.0.appointment_number', $appointment->appointment_number));
});

test('doctor can call next patient from own queue', function () {
    Event::fake([QueueUpdated::class]);
    $doctor = Doctor::factory()->create();
    $doctor->user->givePermissionTo(permission('queues.call'));
    $queue = ClinicQueue::factory()->create([
        'doctor_id' => $doctor->id,
        'queue_date' => now()->toDateString(),
        'status' => ClinicQueue::STATUS_WAITING,
    ]);

    $this->actingAs($doctor->user)
        ->patch(route('queues.call-next'))
        ->assertRedirect();

    expect($queue->fresh())
        ->status->toBe(ClinicQueue::STATUS_CALLED)
        ->called_at->not->toBeNull();

    Event::assertDispatched(QueueUpdated::class);
});

test('skipped patients can be recalled', function () {
    $actor = userWithPermissions(['queues.call', 'queues.view']);
    $queue = ClinicQueue::factory()->create([
        'status' => ClinicQueue::STATUS_SKIPPED,
    ]);

    $this->actingAs($actor)
        ->patch(route('queues.recall', $queue))
        ->assertRedirect();

    expect($queue->fresh()->status)->toBe(ClinicQueue::STATUS_CALLED);
});

test('completed consultations are removed from active queue', function () {
    $actor = userWithPermissions(['queues.call', 'queues.view']);
    $queue = ClinicQueue::factory()->create([
        'status' => ClinicQueue::STATUS_IN_CONSULTATION,
        'queue_date' => now()->toDateString(),
    ]);

    $this->actingAs($actor)
        ->patch(route('queues.complete', $queue))
        ->assertRedirect();

    $this->actingAs($actor)
        ->get(route('queues.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('active_queues', []));
});

test('public queue display is available', function () {
    ClinicQueue::factory()->create([
        'queue_number' => 'Q-001',
        'queue_date' => now()->toDateString(),
    ]);

    $this->get(route('queues.display'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('queues/display')
            ->where('queues.0.queue_number', 'Q-001'));
});

/**
 * @param  list<string>  $permissions
 */
function userWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permissionName) {
        permission($permissionName);
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function permission(string $name): Permission
{
    return Permission::firstOrCreate([
        'name' => $name,
        'guard_name' => 'web',
    ]);
}
