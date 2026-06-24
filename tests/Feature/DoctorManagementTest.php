<?php

use App\Models\Doctor;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('authorized admins can view doctor management', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'doctors.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('doctors.view');

    Doctor::factory()->create([
        'first_name' => 'Ana',
        'last_name' => 'Reyes',
        'specialization' => 'Pediatrics',
    ]);

    $this->actingAs($actor)
        ->get(route('doctors.index', ['search' => 'Pediatrics']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('doctors/index')
            ->where('doctors.total', 1)
            ->where('doctors.data.0.full_name', 'Ana Reyes'));
});

test('authorized admins can create doctor profiles linked to users', function () {
    $actor = User::factory()->create();
    $doctorUser = User::factory()->create([
        'name' => 'Dr. Ana Reyes',
        'email' => 'ana.reyes@example.com',
    ]);
    Permission::firstOrCreate(['name' => 'doctors.create', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'doctors.view', 'guard_name' => 'web']);
    $actor->givePermissionTo(['doctors.create', 'doctors.view']);

    $this->actingAs($actor)
        ->post(route('doctors.store'), validDoctorData([
            'user_id' => $doctorUser->id,
        ]))
        ->assertRedirect();

    $doctor = Doctor::query()->firstOrFail();

    expect($doctor->doctor_code)
        ->toStartWith('DOC-')
        ->and($doctor->user_id)->toBe($doctorUser->id)
        ->and($doctorUser->fresh()->hasRole('Doctor'))->toBeTrue();
});

test('license numbers must be unique', function () {
    $actor = User::factory()->create();
    $doctorUser = User::factory()->create();
    Permission::firstOrCreate(['name' => 'doctors.create', 'guard_name' => 'web']);
    $actor->givePermissionTo('doctors.create');

    Doctor::factory()->create(['license_number' => 'PRC-123456']);

    $this->actingAs($actor)
        ->post(route('doctors.store'), validDoctorData([
            'user_id' => $doctorUser->id,
            'license_number' => 'PRC-123456',
        ]))
        ->assertSessionHasErrors('license_number');
});

test('authorized admins can update doctor status and details', function () {
    $actor = User::factory()->create();
    $newDoctorUser = User::factory()->create();
    $doctor = Doctor::factory()->create();
    Permission::firstOrCreate(['name' => 'doctors.update', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'doctors.view', 'guard_name' => 'web']);
    $actor->givePermissionTo(['doctors.update', 'doctors.view']);

    $this->actingAs($actor)
        ->put(route('doctors.update', $doctor), validDoctorData([
            'user_id' => $newDoctorUser->id,
            'first_name' => 'Updated',
            'status' => 'inactive',
        ]))
        ->assertRedirect(route('doctors.show', $doctor));

    expect($doctor->fresh())
        ->first_name->toBe('Updated')
        ->status->toBe('inactive');
});

test('doctors can view their own profile and schedule', function () {
    $doctor = Doctor::factory()->create();

    $this->actingAs($doctor->user)
        ->get(route('doctors.show', $doctor))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('doctors/show')
            ->where('doctor.id', $doctor->id)
            ->has('appointments')
            ->has('consultations'));

    $this->actingAs($doctor->user)
        ->get(route('doctors.schedule', $doctor))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('doctors/schedule')
            ->where('doctor.id', $doctor->id));
});

test('assignment options only include active doctors', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'doctors.assign', 'guard_name' => 'web']);
    $actor->givePermissionTo('doctors.assign');

    $activeDoctor = Doctor::factory()->create(['status' => 'active']);
    Doctor::factory()->inactive()->create();

    $this->actingAs($actor)
        ->getJson(route('doctors.assignment-options'))
        ->assertSuccessful()
        ->assertJsonCount(1, 'doctors')
        ->assertJsonPath('doctors.0.id', $activeDoctor->id);
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validDoctorData(array $overrides = []): array
{
    return [
        'user_id' => User::factory()->create()->id,
        'first_name' => 'Ana',
        'last_name' => 'Reyes',
        'specialization' => 'Pediatrics',
        'license_number' => 'PRC-654321',
        'contact_number' => '09170000003',
        'email' => 'ana.reyes@example.com',
        'consultation_fee' => '750.00',
        'schedule' => 'Monday to Friday, 9:00 AM - 5:00 PM',
        'status' => 'active',
        ...$overrides,
    ];
}
