<?php

use App\Models\Patient;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('authorized users can view and search patients', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'patients.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('patients.view');

    Patient::factory()->create([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'patient_code' => 'PAT-SEARCH-001',
        'contact_number' => '09170000001',
    ]);
    Patient::factory()->create([
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'patient_code' => 'PAT-SEARCH-002',
        'contact_number' => '09170000002',
    ]);

    $this->actingAs($actor)
        ->get(route('patients.index', ['search' => 'Maria']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patients/index')
            ->where('patients.total', 1)
            ->where('patients.data.0.full_name', 'Maria Santos'));
});

test('authorized users can register patients with a unique patient code', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'patients.create', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'patients.view', 'guard_name' => 'web']);
    $actor->givePermissionTo(['patients.create', 'patients.view']);

    $this->actingAs($actor)
        ->post(route('patients.store'), validPatientData())
        ->assertRedirect();

    $patient = Patient::query()->firstOrFail();

    expect($patient->patient_code)
        ->toStartWith('PAT-')
        ->and($patient->age)->toBeInt();
});

test('duplicate patients are rejected by name birthdate and contact number', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'patients.create', 'guard_name' => 'web']);
    $actor->givePermissionTo('patients.create');

    Patient::factory()->create([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'birthdate' => '1995-04-20',
        'contact_number' => '09170000001',
    ]);

    $this->actingAs($actor)
        ->post(route('patients.store'), validPatientData([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'birthdate' => '1995-04-20',
            'contact_number' => '09170000001',
        ]))
        ->assertSessionHasErrors('contact_number');
});

test('authorized users can view patient profile and medical history sections', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'patients.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('patients.view');
    $patient = Patient::factory()->create();

    $this->actingAs($actor)
        ->get(route('patients.show', $patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patients/show')
            ->where('patient.id', $patient->id)
            ->has('medical_history.appointments')
            ->has('medical_history.consultations')
            ->has('medical_history.prescriptions')
            ->has('medical_history.laboratory_requests')
            ->has('medical_history.billing_history'));
});

test('authorized users can update and deactivate patients', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'patients.update', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'patients.deactivate', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'patients.view', 'guard_name' => 'web']);
    $actor->givePermissionTo(['patients.update', 'patients.deactivate', 'patients.view']);
    $patient = Patient::factory()->create();

    $this->actingAs($actor)
        ->put(route('patients.update', $patient), validPatientData([
            'first_name' => 'Updated',
        ]))
        ->assertRedirect(route('patients.show', $patient));

    expect($patient->fresh()->first_name)->toBe('Updated');

    $this->actingAs($actor)
        ->patch(route('patients.deactivate', $patient))
        ->assertRedirect(route('patients.show', $patient));

    expect($patient->fresh()->status)->toBe('inactive');
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validPatientData(array $overrides = []): array
{
    return [
        'first_name' => 'Maria',
        'middle_name' => 'Reyes',
        'last_name' => 'Santos',
        'suffix' => null,
        'gender' => 'female',
        'birthdate' => '1995-04-20',
        'civil_status' => 'single',
        'contact_number' => '09170000001',
        'email' => 'maria.santos@example.com',
        'address' => '123 Mabini Street',
        'emergency_contact_name' => 'Jose Santos',
        'emergency_contact_number' => '09170000002',
        'blood_type' => 'O+',
        'allergies' => 'Penicillin',
        'existing_conditions' => 'Asthma',
        ...$overrides,
    ];
}
