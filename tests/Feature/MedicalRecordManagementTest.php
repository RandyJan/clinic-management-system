<?php

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\LaboratoryRequest;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use App\Models\VitalSign;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('administrator can search records by patient name or code', function () {
    $administrator = medicalRecordUserWithPermission('medical-records.view');
    $matchingPatient = Patient::factory()->create([
        'patient_code' => 'PAT-SEARCH-001',
        'first_name' => 'Marisol',
        'last_name' => 'Santos',
    ]);
    Patient::factory()->create(['first_name' => 'Unrelated']);

    $this->actingAs($administrator)
        ->get(route('medical-records.index', ['search' => 'Marisol']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medical-records/index')
            ->has('records.data', 1)
            ->where('records.data.0.id', $matchingPatient->id));

    $this->actingAs($administrator)
        ->get(route('medical-records.index', ['search' => 'PAT-SEARCH-001']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->where('records.data.0.id', $matchingPatient->id));
});

test('medical record aggregates the complete clinical history', function () {
    $administrator = medicalRecordUserWithPermission('medical-records.view');
    $patient = Patient::factory()->create([
        'allergies' => 'Penicillin',
        'existing_conditions' => 'Asthma',
    ]);
    $doctor = Doctor::factory()->create();
    $appointment = Appointment::factory()->create(['patient_id' => $patient->id, 'doctor_id' => $doctor->id]);
    $consultation = Consultation::factory()->completed()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'diagnosis' => 'Community acquired pneumonia',
        'follow_up_date' => now()->addWeek()->toDateString(),
    ]);
    Prescription::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'medications' => 'Amoxicillin 500 mg',
    ]);
    LaboratoryRequest::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'tests' => 'Complete blood count',
        'status' => 'Completed',
        'result' => 'White blood cell count elevated',
        'resulted_at' => now(),
    ]);
    VitalSign::factory()->create([
        'patient_id' => $patient->id,
        'appointment_id' => $appointment->id,
        'blood_pressure' => '120/80',
    ]);

    $this->actingAs($administrator)
        ->get(route('medical-records.show', $patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medical-records/show')
            ->where('record.patient.allergies', 'Penicillin')
            ->where('record.patient.existing_conditions', 'Asthma')
            ->where('record.consultations.0.diagnosis', 'Community acquired pneumonia')
            ->where('record.diagnoses.0.diagnosis', 'Community acquired pneumonia')
            ->where('record.prescriptions.0.medications', 'Amoxicillin 500 mg')
            ->where('record.laboratory_requests.0.result', 'White blood cell count elevated')
            ->where('record.vital_signs.0.blood_pressure', '120/80')
            ->has('record.follow_ups', 1));
});

test('doctor can only view records for assigned patients', function () {
    $doctor = Doctor::factory()->create();
    $doctor->user->givePermissionTo(medicalRecordPermission('medical-records.assigned.view'));
    $assignedPatient = Patient::factory()->create();
    $otherPatient = Patient::factory()->create();
    Appointment::factory()->create(['patient_id' => $assignedPatient->id, 'doctor_id' => $doctor->id]);

    $this->actingAs($doctor->user)
        ->get(route('medical-records.show', $assignedPatient))
        ->assertSuccessful();

    $this->actingAs($doctor->user)
        ->get(route('medical-records.show', $otherPatient))
        ->assertForbidden();

    $this->actingAs($doctor->user)
        ->get(route('medical-records.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('records.data', 1)
            ->where('records.data.0.id', $assignedPatient->id));
});

test('patient portal user can view only their own record when enabled', function () {
    config()->set('clinic.patient_portal_enabled', true);
    $portalUser = medicalRecordUserWithPermission('medical-records.own.view');
    $ownPatient = Patient::factory()->create(['user_id' => $portalUser->id]);
    $otherPatient = Patient::factory()->create();

    $this->actingAs($portalUser)
        ->get(route('medical-records.show', $ownPatient))
        ->assertSuccessful();

    $this->actingAs($portalUser)
        ->get(route('medical-records.show', $otherPatient))
        ->assertForbidden();

    config()->set('clinic.patient_portal_enabled', false);

    $this->actingAs($portalUser)
        ->get(route('medical-records.show', $ownPatient))
        ->assertForbidden();
});

test('users without medical record access are forbidden', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();

    $this->actingAs($user)->get(route('medical-records.index'))->assertForbidden();
    $this->actingAs($user)->get(route('medical-records.show', $patient))->assertForbidden();
    $this->actingAs($user)->get(route('medical-records.print', $patient))->assertForbidden();
    $this->actingAs($user)->get(route('medical-records.export', $patient))->assertForbidden();
});

test('authorized user can open printable record and export a valid pdf', function () {
    $administrator = medicalRecordUserWithPermission('medical-records.view');
    $patient = Patient::factory()->create();

    $this->actingAs($administrator)
        ->get(route('medical-records.print', $patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('medical-records/print'));

    $response = $this->actingAs($administrator)->get(route('medical-records.export', $patient));

    $response->assertSuccessful()
        ->assertHeader('content-type', 'application/pdf')
        ->assertDownload("medical-record-{$patient->patient_code}.pdf");

    expect($response->getContent())->toStartWith('%PDF-1.4');
});

function medicalRecordUserWithPermission(string $permission): User
{
    $user = User::factory()->create();
    $user->givePermissionTo(medicalRecordPermission($permission));

    return $user;
}

function medicalRecordPermission(string $name): Permission
{
    return Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
}
