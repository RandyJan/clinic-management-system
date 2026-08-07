<?php

use App\Models\Appointment;
use App\Models\Billing;
use App\Models\ClinicQueue;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\LaboratoryRequest;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    dashboardPermission('dashboard.view');
});

test('administrator dashboard shows clinic wide counts', function () {
    $administrator = dashboardUserWithRole('Administrator');
    $patients = Patient::factory()->count(2)->create();
    $doctor = Doctor::factory()->create();
    $appointment = Appointment::factory()->create([
        'patient_id' => $patients->first()->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
    ]);
    $consultation = Consultation::factory()->completed()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $appointment->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    Billing::factory()->paid()->has(Payment::factory()->state([
        'amount_paid' => 750,
        'payment_date' => now(),
    ]), 'payments')->create(['patient_id' => $patients->first()->id]);
    LaboratoryRequest::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $appointment->patient_id,
        'doctor_id' => $doctor->id,
        'status' => LaboratoryRequest::STATUS_PENDING,
    ]);
    Medicine::factory()->create([
        'current_stock' => 2,
        'reorder_level' => 5,
        'status' => Medicine::STATUS_ACTIVE,
    ]);

    $this->actingAs($administrator)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('dashboard.role', 'Administrator')
            ->where('dashboard.stats.0.label', 'Total patients')
            ->where('dashboard.stats.0.value', 2)
            ->where('dashboard.stats.2.value', 1)
            ->where('dashboard.stats.3.value', 750.0)
            ->where('dashboard.stats.4.value', 1)
            ->where('dashboard.stats.5.value', 1));
});

test('doctor dashboard only shows assigned doctor data', function () {
    $doctor = Doctor::factory()->create();
    $doctor->user->assignRole(dashboardRole('Doctor'));
    $otherDoctor = Doctor::factory()->create();
    $appointment = Appointment::factory()->create([
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
    ]);
    Appointment::factory()->create([
        'doctor_id' => $otherDoctor->id,
        'appointment_date' => today(),
    ]);
    ClinicQueue::factory()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $appointment->patient_id,
        'doctor_id' => $doctor->id,
        'queue_date' => today(),
        'status' => ClinicQueue::STATUS_WAITING,
    ]);
    Consultation::factory()->completed()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $appointment->patient_id,
        'doctor_id' => $doctor->id,
        'completed_at' => now(),
    ]);

    $this->actingAs($doctor->user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('dashboard.role', 'Doctor')
            ->where('dashboard.stats.0.value', 1)
            ->where('dashboard.stats.1.value', 1)
            ->where('dashboard.stats.2.value', 1)
            ->where('dashboard.tables.0.rows.0.Queue', fn (string $queueNumber): bool => str_starts_with($queueNumber, 'Q')));
});

test('patient dashboard only shows the linked patient records', function () {
    $patientUser = dashboardUserWithRole('Patient');
    $patient = Patient::factory()->create(['user_id' => $patientUser->id]);
    $otherPatient = Patient::factory()->create();
    $doctor = Doctor::factory()->create();
    Appointment::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today()->addDay(),
    ]);
    Appointment::factory()->create([
        'patient_id' => $otherPatient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today()->addDay(),
    ]);
    Consultation::factory()->completed()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
    ]);
    Prescription::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
    ]);
    Billing::factory()->has(Payment::factory()->state([
        'amount_paid' => 300,
        'payment_date' => now(),
    ]), 'payments')->create([
        'patient_id' => $patient->id,
        'grand_total' => 1000,
        'payment_status' => Billing::STATUS_PARTIALLY_PAID,
    ]);

    $this->actingAs($patientUser)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('dashboard.role', 'Patient')
            ->where('dashboard.stats.0.value', 1)
            ->where('dashboard.stats.1.value', 1)
            ->where('dashboard.stats.2.value', 1)
            ->where('dashboard.stats.3.value', 700.0));
});

function dashboardUserWithRole(string $roleName): User
{
    $user = User::factory()->create();
    $user->assignRole(dashboardRole($roleName));

    return $user;
}

function dashboardRole(string $name): Role
{
    return Role::firstOrCreate([
        'name' => $name,
        'guard_name' => 'web',
    ])->givePermissionTo(dashboardPermission('dashboard.view'));
}

function dashboardPermission(string $name): Permission
{
    return Permission::firstOrCreate([
        'name' => $name,
        'guard_name' => 'web',
    ]);
}
