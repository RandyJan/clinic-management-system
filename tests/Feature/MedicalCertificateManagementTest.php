<?php

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\MedicalCertificate;
use App\Models\Patient;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('doctor can issue and print medical certificate after consultation', function () {
    $doctor = Doctor::factory()->create();
    $doctor->user->givePermissionTo([
        medicalCertificatePermission('medical-certificates.create'),
        medicalCertificatePermission('medical-certificates.doctor.view'),
    ]);
    $consultation = medicalCertificateConsultation($doctor);

    $this->actingAs($doctor->user)
        ->get(route('medical-certificates.create', $consultation))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medical-certificates/create')
            ->where('consultation.id', $consultation->id)
            ->where('consultation.patient_id', $consultation->patient_id)
            ->where('consultation.doctor_id', $doctor->id));

    $this->actingAs($doctor->user)
        ->post(route('medical-certificates.store'), medicalCertificatePayload($consultation, [
            'diagnosis' => 'Acute viral illness',
            'recommendation' => 'Patient is advised to rest and hydrate.',
            'rest_days' => 3,
        ]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $certificate = MedicalCertificate::query()->firstOrFail();

    expect($certificate)
        ->certificate_number->toStartWith('MC-')
        ->patient_id->toBe($consultation->patient_id)
        ->consultation_id->toBe($consultation->id)
        ->doctor_id->toBe($doctor->id)
        ->diagnosis->toBe('Acute viral illness')
        ->recommendation->toBe('Patient is advised to rest and hydrate.');

    $this->actingAs($doctor->user)
        ->get(route('medical-certificates.show', $certificate))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medical-certificates/show')
            ->where('certificate.id', $certificate->id)
            ->where('certificate.certificate_number', $certificate->certificate_number));

    $this->actingAs($doctor->user)
        ->get(route('medical-certificates.print', $certificate))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medical-certificates/print')
            ->where('certificate.id', $certificate->id));
});

test('medical certificate appears in patient record', function () {
    $actor = medicalCertificateUserWithPermissions(['patients.view', 'medical-certificates.view']);
    $consultation = medicalCertificateConsultation();
    $certificate = MedicalCertificate::factory()->forPatientConsultation(
        $consultation->patient,
        $consultation,
        $consultation->doctor,
    )->create([
        'diagnosis' => 'Tension headache',
        'recommendation' => 'Rest for one day and return if symptoms persist.',
    ]);

    $this->actingAs($actor)
        ->get(route('patients.show', $consultation->patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('medical_history.medical_certificates.0.id', $certificate->id)
            ->where('medical_history.medical_certificates.0.certificate_number', $certificate->certificate_number)
            ->where('medical_history.medical_certificates.0.diagnosis', 'Tension headache'));
});

test('medical certificate validation requires linked records and clinical text', function () {
    $doctor = Doctor::factory()->create();
    $doctor->user->givePermissionTo(medicalCertificatePermission('medical-certificates.create'));

    $this->actingAs($doctor->user)
        ->post(route('medical-certificates.store'), [
            'patient_id' => '',
            'consultation_id' => '',
            'doctor_id' => '',
            'diagnosis' => '',
            'recommendation' => '',
            'issued_date' => '',
        ])
        ->assertSessionHasErrors([
            'patient_id',
            'consultation_id',
            'doctor_id',
            'diagnosis',
            'recommendation',
            'issued_date',
        ]);
});

test('doctor cannot issue certificate for another doctor consultation', function () {
    $assignedDoctor = Doctor::factory()->create();
    $otherDoctor = Doctor::factory()->create();
    $otherDoctor->user->givePermissionTo(medicalCertificatePermission('medical-certificates.create'));
    $consultation = medicalCertificateConsultation($assignedDoctor);

    $this->actingAs($otherDoctor->user)
        ->post(route('medical-certificates.store'), medicalCertificatePayload($consultation))
        ->assertForbidden();
});

function medicalCertificateConsultation(?Doctor $doctor = null): Consultation
{
    $doctor ??= Doctor::factory()->create();
    $patient = Patient::factory()->create();
    $appointment = Appointment::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'status' => Appointment::STATUS_COMPLETED,
    ]);

    return Consultation::factory()->completed()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'diagnosis' => 'Upper respiratory tract infection',
    ]);
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function medicalCertificatePayload(Consultation $consultation, array $overrides = []): array
{
    return [
        'patient_id' => $consultation->patient_id,
        'consultation_id' => $consultation->id,
        'doctor_id' => $consultation->doctor_id,
        'diagnosis' => 'Upper respiratory tract infection',
        'recommendation' => 'Patient may resume work after symptoms improve.',
        'rest_days' => 2,
        'issued_date' => now()->toDateString(),
        'remarks' => 'Generated during follow-up.',
        ...$overrides,
    ];
}

/**
 * @param  list<string>  $permissions
 */
function medicalCertificateUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permissionName) {
        medicalCertificatePermission($permissionName);
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function medicalCertificatePermission(string $name): Permission
{
    return Permission::firstOrCreate([
        'name' => $name,
        'guard_name' => 'web',
    ]);
}
