<?php

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\LaboratoryRequest;
use App\Models\LaboratoryResult;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('assigned doctor can create a request with multiple laboratory tests', function () {
    [$doctor, $consultation] = labConsultation();
    $doctor->user->givePermissionTo([
        labPermission('laboratory-requests.create'),
        labPermission('laboratory-requests.doctor.view'),
    ]);

    $this->actingAs($doctor->user)
        ->get(route('laboratory-requests.create', $consultation))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('laboratory-requests/create')
            ->where('consultation.id', $consultation->id));

    $this->actingAs($doctor->user)
        ->post(route('laboratory-requests.store'), labRequestPayload($consultation))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $laboratoryRequest = LaboratoryRequest::query()->latest('id')->firstOrFail();
    expect($laboratoryRequest)
        ->lab_request_number->toStartWith('LAB-')
        ->requested_tests->toBe(['Complete blood count', 'Urinalysis'])
        ->status->toBe(LaboratoryRequest::STATUS_PENDING)
        ->requested_at->not->toBeNull();
});

test('laboratory request validation requires consultation patient doctor and tests', function () {
    [$doctor, $consultation] = labConsultation();
    $doctor->user->givePermissionTo(labPermission('laboratory-requests.create'));

    $this->actingAs($doctor->user)
        ->post(route('laboratory-requests.store'), [
            'consultation_id' => $consultation->id,
            'patient_id' => $consultation->patient_id,
            'doctor_id' => $consultation->doctor_id,
            'requested_tests' => [],
        ])
        ->assertSessionHasErrors('requested_tests');
});

test('doctor cannot create a request for another doctors consultation', function () {
    [, $consultation] = labConsultation();
    $otherDoctor = Doctor::factory()->create();
    $otherDoctor->user->givePermissionTo(labPermission('laboratory-requests.create'));

    $this->actingAs($otherDoctor->user)
        ->get(route('laboratory-requests.create', $consultation))
        ->assertForbidden();
    $this->actingAs($otherDoctor->user)
        ->post(route('laboratory-requests.store'), labRequestPayload($consultation))
        ->assertForbidden();
});

test('authorized staff can update status but cannot complete a request without results', function () {
    [$doctor, $consultation] = labConsultation();
    $laboratoryRequest = LaboratoryRequest::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    $staff = labUserWithPermissions(['laboratory-requests.view', 'laboratory-requests.update-status']);

    $this->actingAs($staff)
        ->patch(route('laboratory-requests.update-status', $laboratoryRequest), ['status' => 'In Progress'])
        ->assertRedirect();
    expect($laboratoryRequest->fresh()->status)->toBe(LaboratoryRequest::STATUS_IN_PROGRESS);

    $this->actingAs($staff)
        ->patch(route('laboratory-requests.update-status', $laboratoryRequest), ['status' => 'Completed'])
        ->assertSessionHasErrors('status');
    expect($laboratoryRequest->fresh()->status)->toBe(LaboratoryRequest::STATUS_IN_PROGRESS);
});

test('authorized staff can upload text and attachment and complete the request', function () {
    Storage::fake('local');
    [$doctor, $consultation] = labConsultation();
    $laboratoryRequest = LaboratoryRequest::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    $staff = labUserWithPermissions(['laboratory-requests.view', 'laboratory-requests.upload-results']);

    $this->actingAs($staff)
        ->post(route('laboratory-requests.store-result', $laboratoryRequest), [
            'result_details' => 'Hemoglobin: 135 g/L; WBC: 7.2 x10^9/L',
            'remarks' => 'Within normal limits.',
            'attachment' => UploadedFile::fake()->create('cbc-result.pdf', 100, 'application/pdf'),
        ])
        ->assertRedirect(route('laboratory-requests.result', $laboratoryRequest))
        ->assertSessionHasNoErrors();

    $result = LaboratoryResult::query()->firstOrFail();
    expect($result)
        ->result_details->toContain('Hemoglobin')
        ->uploaded_by->toBe($staff->id)
        ->and($laboratoryRequest->fresh())
        ->status->toBe(LaboratoryRequest::STATUS_COMPLETED)
        ->completed_at->not->toBeNull();
    Storage::disk('local')->assertExists($result->attachment_path);

    $this->actingAs($staff)
        ->get(route('laboratory-requests.result', $laboratoryRequest))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('laboratory-requests/result')
            ->where('laboratory_request.result.result_details', 'Hemoglobin: 135 g/L; WBC: 7.2 x10^9/L'));

    $this->actingAs($staff)
        ->get(route('laboratory-requests.attachment', $laboratoryRequest))
        ->assertSuccessful();
});

test('result details are required and attachment type is validated', function () {
    [, $consultation] = labConsultation();
    $laboratoryRequest = LaboratoryRequest::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $consultation->doctor_id,
    ]);
    $staff = labUserWithPermissions(['laboratory-requests.view', 'laboratory-requests.upload-results']);

    $this->actingAs($staff)
        ->post(route('laboratory-requests.store-result', $laboratoryRequest), [
            'result_details' => '',
            'attachment' => UploadedFile::fake()->create('unsafe.exe', 10, 'application/octet-stream'),
        ])
        ->assertSessionHasErrors(['result_details', 'attachment']);
});

test('requesting doctor can view results and unrelated users cannot', function () {
    [$doctor, $consultation] = labConsultation();
    $doctor->user->givePermissionTo(labPermission('laboratory-requests.doctor.view'));
    $laboratoryRequest = LaboratoryRequest::factory()->completed()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    LaboratoryResult::factory()->create(['lab_request_id' => $laboratoryRequest->id]);

    $this->actingAs($doctor->user)
        ->get(route('laboratory-requests.result', $laboratoryRequest))
        ->assertSuccessful();
    $this->actingAs(User::factory()->create())
        ->get(route('laboratory-requests.result', $laboratoryRequest))
        ->assertForbidden();
});

test('patient can view only own results when portal is enabled', function () {
    config()->set('clinic.patient_portal_enabled', true);
    $portalUser = labUserWithPermissions(['laboratory-requests.own.view']);
    $patient = Patient::factory()->create(['user_id' => $portalUser->id]);
    [$doctor, $consultation] = labConsultation($patient);
    $ownRequest = LaboratoryRequest::factory()->completed()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
    ]);
    LaboratoryResult::factory()->create(['lab_request_id' => $ownRequest->id]);
    $otherRequest = LaboratoryRequest::factory()->completed()->create();
    LaboratoryResult::factory()->create(['lab_request_id' => $otherRequest->id]);

    $this->actingAs($portalUser)->get(route('laboratory-requests.result', $ownRequest))->assertSuccessful();
    $this->actingAs($portalUser)->get(route('laboratory-requests.result', $otherRequest))->assertForbidden();

    config()->set('clinic.patient_portal_enabled', false);
    $this->actingAs($portalUser)->get(route('laboratory-requests.result', $ownRequest))->assertForbidden();
});

test('completed normalized result appears in patient medical record', function () {
    [$doctor, $consultation] = labConsultation();
    $laboratoryRequest = LaboratoryRequest::factory()->completed()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
        'requested_tests' => ['Thyroid stimulating hormone'],
    ]);
    LaboratoryResult::factory()->create([
        'lab_request_id' => $laboratoryRequest->id,
        'result_details' => 'TSH: 2.1 mIU/L',
    ]);
    $administrator = labUserWithPermissions(['medical-records.view']);

    $this->actingAs($administrator)
        ->get(route('medical-records.show', $consultation->patient_id))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('record.laboratory_requests.0.result', 'TSH: 2.1 mIU/L')
            ->where('record.laboratory_requests.0.tests', 'Thyroid stimulating hormone'));
});

/** @return array{Doctor, Consultation} */
function labConsultation(?Patient $patient = null): array
{
    $doctor = Doctor::factory()->create();
    $patient ??= Patient::factory()->create();
    $appointment = Appointment::factory()->create(['patient_id' => $patient->id, 'doctor_id' => $doctor->id]);
    $consultation = Consultation::factory()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
    ]);

    return [$doctor, $consultation];
}

/** @return array<string, mixed> */
function labRequestPayload(Consultation $consultation): array
{
    return [
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $consultation->doctor_id,
        'requested_tests' => ['Complete blood count', 'Urinalysis'],
        'clinical_notes' => 'Fever for three days.',
    ];
}

/** @param list<string> $permissions */
function labUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();
    foreach ($permissions as $permission) {
        labPermission($permission);
    }
    $user->givePermissionTo($permissions);

    return $user;
}

function labPermission(string $name): Permission
{
    return Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
}
