<?php

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('assigned doctor can create a prescription with inventory and custom medicines', function () {
    [$doctor, $consultation] = prescriptionConsultation();
    $doctor->user->givePermissionTo([
        prescriptionPermission('prescriptions.create'),
        prescriptionPermission('prescriptions.doctor.view'),
    ]);
    $medicine = Medicine::factory()->create(['name' => 'Paracetamol 500 mg', 'stock_quantity' => 50]);

    $this->actingAs($doctor->user)
        ->get(route('prescriptions.create', $consultation))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('prescriptions/create')
            ->where('consultation.id', $consultation->id)
            ->where('medicines.0.id', $medicine->id));

    $this->actingAs($doctor->user)
        ->post(route('prescriptions.store'), prescriptionPayload($consultation, [
            [
                'medicine_id' => $medicine->id,
                'medicine_name' => '',
                'dosage' => '1 tablet',
                'frequency' => 'Every 6 hours',
                'duration' => '3 days',
                'quantity' => 12,
                'instructions' => 'Take after meals',
            ],
            [
                'medicine_id' => null,
                'medicine_name' => 'Custom compounded syrup',
                'dosage' => '5 mL',
                'frequency' => 'Twice daily',
                'duration' => '5 days',
                'quantity' => 1,
                'instructions' => 'Shake well',
            ],
        ]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $prescription = Prescription::query()->latest('id')->firstOrFail();

    expect($prescription)
        ->prescription_number->toStartWith('RX-')
        ->status->toBe(Prescription::STATUS_PENDING)
        ->patient_id->toBe($consultation->patient_id)
        ->doctor_id->toBe($doctor->id)
        ->and($prescription->items)->toHaveCount(2)
        ->and($prescription->items->firstWhere('medicine_id', $medicine->id)?->medicine_name)->toBe('Paracetamol 500 mg')
        ->and($prescription->items->firstWhere('medicine_id', null)?->medicine_name)->toBe('Custom compounded syrup');
});

test('prescription validation requires at least one complete item', function () {
    [$doctor, $consultation] = prescriptionConsultation();
    $doctor->user->givePermissionTo(prescriptionPermission('prescriptions.create'));

    $this->actingAs($doctor->user)
        ->post(route('prescriptions.store'), prescriptionPayload($consultation, []))
        ->assertSessionHasErrors('items');

    $this->actingAs($doctor->user)
        ->post(route('prescriptions.store'), prescriptionPayload($consultation, [[
            'medicine_id' => null,
            'medicine_name' => 'Custom medicine',
            'dosage' => '',
            'frequency' => '',
            'duration' => '',
            'quantity' => 'not-a-number',
            'instructions' => '',
        ]]))
        ->assertSessionHasErrors([
            'items.0.dosage',
            'items.0.frequency',
            'items.0.duration',
            'items.0.quantity',
        ]);
});

test('doctor cannot create prescription for another doctors consultation', function () {
    [, $consultation] = prescriptionConsultation();
    $otherDoctor = Doctor::factory()->create();
    $otherDoctor->user->givePermissionTo(prescriptionPermission('prescriptions.create'));

    $this->actingAs($otherDoctor->user)
        ->get(route('prescriptions.create', $consultation))
        ->assertForbidden();

    $this->actingAs($otherDoctor->user)
        ->post(route('prescriptions.store'), prescriptionPayload($consultation))
        ->assertForbidden();
});

test('pharmacist can view pending prescriptions and dispensing reduces inventory stock', function () {
    [$doctor, $consultation] = prescriptionConsultation();
    $medicine = Medicine::factory()->create(['stock_quantity' => 20]);
    $prescription = Prescription::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    PrescriptionItem::factory()->create([
        'prescription_id' => $prescription->id,
        'medicine_id' => $medicine->id,
        'medicine_name' => $medicine->name,
        'quantity' => 6,
    ]);
    $pharmacist = prescriptionUserWithPermissions(['prescriptions.view', 'prescriptions.dispense']);

    $this->actingAs($pharmacist)
        ->get(route('prescriptions.pending'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('prescriptions/pending')
            ->has('prescriptions.data', 1)
            ->where('prescriptions.data.0.id', $prescription->id));

    $this->actingAs($pharmacist)
        ->patch(route('prescriptions.dispense', $prescription))
        ->assertRedirect();

    expect($prescription->fresh())
        ->status->toBe(Prescription::STATUS_DISPENSED)
        ->dispensed_by->toBe($pharmacist->id)
        ->dispensed_at->not->toBeNull()
        ->and($medicine->fresh()->stock_quantity)->toBe(14);
});

test('dispensing aggregates quantities and rolls back when inventory is insufficient', function () {
    [$doctor, $consultation] = prescriptionConsultation();
    $medicine = Medicine::factory()->create(['name' => 'Low stock medicine', 'stock_quantity' => 5]);
    $prescription = Prescription::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    PrescriptionItem::factory()->count(2)->create([
        'prescription_id' => $prescription->id,
        'medicine_id' => $medicine->id,
        'medicine_name' => $medicine->name,
        'quantity' => 3,
    ]);
    $pharmacist = prescriptionUserWithPermissions(['prescriptions.view', 'prescriptions.dispense']);

    $this->actingAs($pharmacist)
        ->patch(route('prescriptions.dispense', $prescription))
        ->assertSessionHasErrors('prescription');

    expect($prescription->fresh()->status)->toBe(Prescription::STATUS_PENDING)
        ->and($medicine->fresh()->stock_quantity)->toBe(5);
});

test('dispensed prescription cannot be dispensed twice', function () {
    [$doctor, $consultation] = prescriptionConsultation();
    $prescription = Prescription::factory()->dispensed()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    $pharmacist = prescriptionUserWithPermissions(['prescriptions.view', 'prescriptions.dispense']);

    $this->actingAs($pharmacist)
        ->patch(route('prescriptions.dispense', $prescription))
        ->assertSessionHasErrors('prescription');
});

test('authorized user can view and print prescription', function () {
    [$doctor, $consultation] = prescriptionConsultation();
    $doctor->user->givePermissionTo(prescriptionPermission('prescriptions.doctor.view'));
    $prescription = Prescription::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    PrescriptionItem::factory()->create(['prescription_id' => $prescription->id]);

    $this->actingAs($doctor->user)
        ->get(route('prescriptions.show', $prescription))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('prescriptions/show')
            ->where('prescription.id', $prescription->id)
            ->has('prescription.items', 1));

    $this->actingAs($doctor->user)
        ->get(route('prescriptions.print', $prescription))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('prescriptions/print'));
});

test('patient can view own prescription history only when portal is enabled', function () {
    config()->set('clinic.patient_portal_enabled', true);
    $portalUser = prescriptionUserWithPermissions(['prescriptions.own.view']);
    [$doctor, $consultation] = prescriptionConsultation(Patient::factory()->create(['user_id' => $portalUser->id]));
    $prescription = Prescription::factory()->create([
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $doctor->id,
    ]);
    $otherPrescription = Prescription::factory()->create();

    $this->actingAs($portalUser)
        ->get(route('patients.prescriptions.index', $consultation->patient_id))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('prescriptions/history')
            ->has('prescriptions.data', 1)
            ->where('prescriptions.data.0.id', $prescription->id));

    $this->actingAs($portalUser)
        ->get(route('prescriptions.show', $otherPrescription))
        ->assertForbidden();

    config()->set('clinic.patient_portal_enabled', false);
    $this->actingAs($portalUser)
        ->get(route('prescriptions.show', $prescription))
        ->assertForbidden();
});

/** @return array{Doctor, Consultation} */
function prescriptionConsultation(?Patient $patient = null): array
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

/**
 * @param  list<array<string, mixed>>|null  $items
 * @return array<string, mixed>
 */
function prescriptionPayload(Consultation $consultation, ?array $items = null): array
{
    return [
        'consultation_id' => $consultation->id,
        'patient_id' => $consultation->patient_id,
        'doctor_id' => $consultation->doctor_id,
        'notes' => 'Complete the full course.',
        'items' => $items ?? [[
            'medicine_id' => null,
            'medicine_name' => 'Custom medicine',
            'dosage' => '1 tablet',
            'frequency' => 'Once daily',
            'duration' => '5 days',
            'quantity' => 5,
            'instructions' => '',
        ]],
    ];
}

/** @param list<string> $permissions */
function prescriptionUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        prescriptionPermission($permission);
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function prescriptionPermission(string $name): Permission
{
    return Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
}
