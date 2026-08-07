<?php

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\StockTransaction;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('pharmacist can add and update medicine details', function () {
    $pharmacist = medicineUserWithPermissions(['medicines.view', 'medicines.create', 'medicines.update']);

    $this->actingAs($pharmacist)
        ->post(route('medicines.store'), medicinePayload([
            'name' => 'Paracetamol 500 mg',
            'current_stock' => 25,
            'reorder_level' => 10,
        ]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $medicine = Medicine::query()->latest('id')->firstOrFail();

    expect($medicine)
        ->medicine_code->toStartWith('MED-')
        ->name->toBe('Paracetamol 500 mg')
        ->current_stock->toBe(25)
        ->stock_quantity->toBe(25)
        ->and($medicine->stockTransactions)->toHaveCount(1);

    $this->actingAs($pharmacist)
        ->put(route('medicines.update', $medicine), medicinePayload([
            'name' => 'Paracetamol 500 mg Tablet',
            'reorder_level' => 15,
            'current_stock' => null,
        ]))
        ->assertRedirect(route('medicines.edit', $medicine))
        ->assertSessionHasNoErrors();

    expect($medicine->fresh())
        ->name->toBe('Paracetamol 500 mg Tablet')
        ->reorder_level->toBe(15)
        ->current_stock->toBe(25);
});

test('medicine validation requires core inventory fields', function () {
    $pharmacist = medicineUserWithPermissions(['medicines.create']);

    $this->actingAs($pharmacist)
        ->post(route('medicines.store'), [
            'name' => '',
            'category' => '',
            'unit' => '',
            'current_stock' => '',
            'reorder_level' => '',
            'selling_price' => 'free',
        ])
        ->assertSessionHasErrors(['name', 'category', 'unit', 'current_stock', 'reorder_level', 'selling_price']);
});

test('stock adjustments update stock and record transaction history', function () {
    $pharmacist = medicineUserWithPermissions(['medicines.view', 'medicines.stock.adjust']);
    $medicine = Medicine::factory()->create(['current_stock' => 10, 'reorder_level' => 5]);

    $this->actingAs($pharmacist)
        ->patch(route('medicines.stock.update', $medicine), [
            'transaction_type' => StockTransaction::TYPE_STOCK_IN,
            'quantity' => 15,
            'remarks' => 'Supplier delivery',
        ])
        ->assertRedirect(route('medicines.transactions', $medicine))
        ->assertSessionHasNoErrors();

    $transaction = StockTransaction::query()->latest('id')->firstOrFail();

    expect($medicine->fresh()->current_stock)->toBe(25)
        ->and($transaction->transaction_type)->toBe(StockTransaction::TYPE_STOCK_IN)
        ->and($transaction->previous_stock)->toBe(10)
        ->and($transaction->new_stock)->toBe(25)
        ->and($transaction->created_by)->toBe($pharmacist->id);

    $this->actingAs($pharmacist)
        ->patch(route('medicines.stock.update', $medicine), [
            'transaction_type' => StockTransaction::TYPE_ADJUSTMENT,
            'quantity' => 8,
            'remarks' => 'Physical count',
        ])
        ->assertSessionHasNoErrors();

    expect($medicine->fresh()->current_stock)->toBe(8);
});

test('reports detect low stock near expiry and expired medicines', function () {
    $pharmacist = medicineUserWithPermissions(['medicines.view']);
    $lowStock = Medicine::factory()->create(['current_stock' => 3, 'reorder_level' => 5]);
    $nearExpiry = Medicine::factory()->create(['expiry_date' => now()->addDays(10)->toDateString()]);
    $expired = Medicine::factory()->create(['expiry_date' => now()->subDay()->toDateString()]);

    $this->actingAs($pharmacist)
        ->get(route('medicines.low-stock'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medicines/low-stock')
            ->where('medicines.data.0.id', $lowStock->id));

    $this->actingAs($pharmacist)
        ->get(route('medicines.expiry', ['expiry_status' => 'near-expiry']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medicines/expiry')
            ->where('medicines.data.0.id', $nearExpiry->id));

    $this->actingAs($pharmacist)
        ->get(route('medicines.expiry', ['expiry_status' => 'expired']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medicines/expiry')
            ->where('medicines.data.0.id', $expired->id));
});

test('dispensing prescription reduces stock and records movement history', function () {
    [$doctor, $consultation] = medicinePrescriptionConsultation();
    $medicine = Medicine::factory()->create(['current_stock' => 20]);
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
    $pharmacist = medicineUserWithPermissions(['prescriptions.view', 'prescriptions.dispense']);

    $this->actingAs($pharmacist)
        ->patch(route('prescriptions.dispense', $prescription))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $transaction = StockTransaction::query()->latest('id')->firstOrFail();

    expect($medicine->fresh()->current_stock)->toBe(14)
        ->and($transaction->transaction_type)->toBe(StockTransaction::TYPE_DISPENSED)
        ->and($transaction->quantity)->toBe(6)
        ->and($transaction->reference_type)->toBe(Prescription::class)
        ->and($transaction->reference_id)->toBe($prescription->id);
});

/** @param array<string, mixed> $overrides */
function medicinePayload(array $overrides = []): array
{
    return [
        'name' => 'Amoxicillin 500 mg',
        'generic_name' => 'Amoxicillin',
        'brand_name' => 'Clinic Brand',
        'category' => 'Antibiotic',
        'dosage_form' => 'Capsule',
        'strength' => '500 mg',
        'unit' => 'capsule',
        'current_stock' => 20,
        'reorder_level' => 5,
        'expiry_date' => now()->addYear()->toDateString(),
        'selling_price' => 25,
        'cost_price' => 15,
        'status' => Medicine::STATUS_ACTIVE,
        ...$overrides,
    ];
}

/** @param list<string> $permissions */
function medicineUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }

    $user->givePermissionTo($permissions);

    return $user;
}

/** @return array{Doctor, Consultation} */
function medicinePrescriptionConsultation(): array
{
    $doctor = Doctor::factory()->create();
    $patient = Patient::factory()->create();
    $appointment = Appointment::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
    ]);
    $consultation = Consultation::factory()->create([
        'appointment_id' => $appointment->id,
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
    ]);

    return [$doctor, $consultation];
}
