<?php

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\LaboratoryRequest;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('assigned doctor can start consultation from appointment', function () {
    $doctor = Doctor::factory()->create();
    $doctor->user->givePermissionTo([
        consultationPermission('appointments.manage-consultations'),
        consultationPermission('consultations.update'),
    ]);
    $appointment = Appointment::factory()->checkedIn()->create([
        'doctor_id' => $doctor->id,
    ]);

    $this->actingAs($doctor->user)
        ->patch(route('appointments.start', $appointment))
        ->assertRedirect();

    $consultation = Consultation::query()->firstOrFail();

    expect($consultation)
        ->consultation_number->toStartWith('CON-')
        ->appointment_id->toBe($appointment->id)
        ->patient_id->toBe($appointment->patient_id)
        ->doctor_id->toBe($doctor->id)
        ->status->toBe(Consultation::STATUS_IN_PROGRESS)
        ->and($appointment->fresh()->status)->toBe(Appointment::STATUS_IN_CONSULTATION);
});

test('doctor can update and complete consultation with prescription and laboratory request', function () {
    $doctor = Doctor::factory()->create();
    $doctor->user->givePermissionTo([
        consultationPermission('consultations.update'),
        consultationPermission('consultations.view'),
    ]);
    $appointment = Appointment::factory()->create([
        'doctor_id' => $doctor->id,
        'status' => Appointment::STATUS_IN_CONSULTATION,
    ]);
    $consultation = Consultation::factory()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $appointment->patient_id,
        'doctor_id' => $doctor->id,
    ]);

    $this->actingAs($doctor->user)
        ->put(route('consultations.update', $consultation), consultationPayload([
            'diagnosis' => 'Acute upper respiratory infection',
            'prescription_medications' => 'Paracetamol 500mg every 6 hours as needed',
            'laboratory_tests' => 'CBC',
        ]))
        ->assertRedirect(route('consultations.edit', $consultation));

    $this->actingAs($doctor->user)
        ->patch(route('consultations.complete', $consultation), consultationPayload([
            'diagnosis' => 'Acute upper respiratory infection',
            'prescription_medications' => 'Paracetamol 500mg every 6 hours as needed',
            'laboratory_tests' => 'CBC',
        ]))
        ->assertRedirect(route('consultations.show', $consultation));

    expect($consultation->fresh())
        ->status->toBe(Consultation::STATUS_COMPLETED)
        ->completed_at->not->toBeNull()
        ->and($appointment->fresh()->status)->toBe(Appointment::STATUS_COMPLETED)
        ->and(Prescription::query()->where('consultation_id', $consultation->id)->exists())->toBeTrue()
        ->and(LaboratoryRequest::query()->where('consultation_id', $consultation->id)->exists())->toBeTrue();
});

test('completed consultation appears in patient history', function () {
    $actor = consultationUserWithPermissions(['consultations.view']);
    $patient = Patient::factory()->create();
    $appointment = Appointment::factory()->create(['patient_id' => $patient->id]);
    $consultation = Consultation::factory()->completed()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $patient->id,
        'doctor_id' => $appointment->doctor_id,
        'diagnosis' => 'Hypertension follow-up',
    ]);

    $this->actingAs($actor)
        ->get(route('patients.consultations.index', $patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('consultations/history')
            ->where('consultations.0.id', $consultation->id)
            ->where('consultations.0.diagnosis', 'Hypertension follow-up'));
});

test('only assigned doctor or admin can update consultation', function () {
    $assignedDoctor = Doctor::factory()->create();
    $otherDoctor = Doctor::factory()->create();
    $otherDoctor->user->givePermissionTo(consultationPermission('consultations.update'));
    $admin = consultationUserWithPermissions(['consultations.update', 'consultations.manage']);
    $appointment = Appointment::factory()->create(['doctor_id' => $assignedDoctor->id]);
    $consultation = Consultation::factory()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $appointment->patient_id,
        'doctor_id' => $assignedDoctor->id,
    ]);

    $this->actingAs($otherDoctor->user)
        ->put(route('consultations.update', $consultation), consultationPayload())
        ->assertForbidden();

    $this->actingAs($admin)
        ->put(route('consultations.update', $consultation), consultationPayload([
            'chief_complaint' => 'Admin corrected complaint',
        ]))
        ->assertRedirect(route('consultations.edit', $consultation));

    expect($consultation->fresh()->chief_complaint)->toBe('Admin corrected complaint');
});

/**
 * @param  array<string, string>  $overrides
 * @return array<string, string>
 */
function consultationPayload(array $overrides = []): array
{
    return [
        'chief_complaint' => 'Fever and cough',
        'history_of_present_illness' => 'Symptoms started three days ago.',
        'diagnosis' => '',
        'treatment_plan' => 'Hydration and rest',
        'doctor_notes' => 'Monitor symptoms.',
        'follow_up_date' => '',
        'prescription_medications' => '',
        'prescription_instructions' => '',
        'laboratory_tests' => '',
        'laboratory_instructions' => '',
        ...$overrides,
    ];
}

/**
 * @param  list<string>  $permissions
 */
function consultationUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permissionName) {
        consultationPermission($permissionName);
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function consultationPermission(string $name): Permission
{
    return Permission::firstOrCreate([
        'name' => $name,
        'guard_name' => 'web',
    ]);
}
