<?php

use App\Models\Appointment;
use App\Models\Billing;
use App\Models\BillingItem;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('cashier can generate bill from appointment and totals are computed', function () {
    $cashier = billingUserWithPermissions(['billing.view', 'billing.create']);
    $appointment = Appointment::factory()->create();

    $this->actingAs($cashier)
        ->get(route('billings.create-from-appointment', $appointment))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('billings/create')
            ->where('source.appointment_id', $appointment->id)
            ->where('source.patient_id', $appointment->patient_id));

    $this->actingAs($cashier)
        ->post(route('billings.store'), billingPayload([
            'patient_id' => $appointment->patient_id,
            'appointment_id' => $appointment->id,
            'discount' => 100,
            'tax' => 50,
        ]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $billing = Billing::query()->latest('id')->firstOrFail();

    expect($billing)
        ->invoice_number->toStartWith('INV-')
        ->total_amount->toEqual('1500.00')
        ->discount->toEqual('100.00')
        ->tax->toEqual('50.00')
        ->grand_total->toEqual('1450.00')
        ->payment_status->toBe(Billing::STATUS_UNPAID)
        ->and($billing->items)->toHaveCount(2);
});

test('billing validation requires patient and at least one numeric item', function () {
    $cashier = billingUserWithPermissions(['billing.create']);

    $this->actingAs($cashier)
        ->post(route('billings.store'), [
            'patient_id' => '',
            'items' => [],
        ])
        ->assertSessionHasErrors(['patient_id', 'items']);

    $patient = Patient::factory()->create();

    $this->actingAs($cashier)
        ->post(route('billings.store'), [
            'patient_id' => $patient->id,
            'items' => [[
                'item_type' => BillingItem::TYPE_OTHER,
                'description' => 'Supplies',
                'quantity' => 'abc',
                'unit_price' => 'free',
            ]],
        ])
        ->assertSessionHasErrors(['items.0.quantity', 'items.0.unit_price']);
});

test('payment updates billing status from partial to paid and receipt is printable', function () {
    $cashier = billingUserWithPermissions(['billing.view', 'billing.payments.create']);
    $billing = billingWithItem(['grand_total' => 1000]);

    $this->actingAs($cashier)
        ->post(route('billings.payments.store', $billing), [
            'payment_method' => Payment::METHOD_CASH,
            'amount_paid' => 400,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($billing->fresh()->payment_status)->toBe(Billing::STATUS_PARTIALLY_PAID);

    $this->actingAs($cashier)
        ->post(route('billings.payments.store', $billing), [
            'payment_method' => Payment::METHOD_GCASH,
            'amount_paid' => 700,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $billing->refresh();
    $payment = Payment::query()->latest('id')->firstOrFail();

    expect($billing->payment_status)->toBe(Billing::STATUS_PAID)
        ->and($payment->amount_paid)->toEqual('600.00')
        ->and($payment->change_amount)->toEqual('100.00');

    $this->actingAs($cashier)
        ->get(route('billings.receipt', [$billing, $payment]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('billings/receipt')
            ->where('billing.invoice_number', $billing->invoice_number)
            ->where('payment_id', $payment->id));
});

test('payment validation requires amount and method', function () {
    $cashier = billingUserWithPermissions(['billing.payments.create']);
    $billing = billingWithItem();

    $this->actingAs($cashier)
        ->post(route('billings.payments.store', $billing), [
            'payment_method' => '',
            'amount_paid' => '',
        ])
        ->assertSessionHasErrors(['payment_method', 'amount_paid']);
});

test('paid bills cannot be edited except by admin', function () {
    $cashier = billingUserWithPermissions(['billing.update']);
    $administrator = billingUserWithPermissions(['billing.update', 'billing.admin']);
    $billing = billingWithItem(['payment_status' => Billing::STATUS_PAID]);

    $this->actingAs($cashier)
        ->put(route('billings.update', $billing), billingPayload([
            'patient_id' => $billing->patient_id,
        ]))
        ->assertForbidden();

    $this->actingAs($administrator)
        ->put(route('billings.update', $billing), billingPayload([
            'patient_id' => $billing->patient_id,
            'discount' => 25,
        ]))
        ->assertRedirect(route('billings.show', $billing))
        ->assertSessionHasNoErrors();

    expect($billing->fresh()->discount)->toEqual('25.00');
});

test('cancelled bills require remarks', function () {
    $cashier = billingUserWithPermissions(['billing.cancel']);
    $billing = billingWithItem();

    $this->actingAs($cashier)
        ->patch(route('billings.cancel', $billing), ['remarks' => ''])
        ->assertSessionHasErrors('remarks');

    $this->actingAs($cashier)
        ->patch(route('billings.cancel', $billing), ['remarks' => 'Duplicate invoice'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($billing->fresh())
        ->payment_status->toBe(Billing::STATUS_CANCELLED)
        ->cancelled_remarks->toBe('Duplicate invoice');
});

test('patient profile includes accurate billing history', function () {
    $actor = billingUserWithPermissions(['patients.view', 'billing.view']);
    $patient = Patient::factory()->create();
    $billing = billingWithItem([
        'patient_id' => $patient->id,
        'grand_total' => 1200,
        'payment_status' => Billing::STATUS_PARTIALLY_PAID,
    ]);
    Payment::factory()->create([
        'billing_id' => $billing->id,
        'amount_paid' => 500,
    ]);

    $this->actingAs($actor)
        ->get(route('patients.show', $patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('medical_history.billing_history.0.id', $billing->id)
            ->where('medical_history.billing_history.0.invoice_number', $billing->invoice_number)
            ->where('medical_history.billing_history.0.amount_paid', 500.0)
            ->where('medical_history.billing_history.0.balance_due', 700.0));
});

/** @param array<string, mixed> $overrides */
function billingPayload(array $overrides = []): array
{
    $patient = Patient::factory()->create();

    return [
        'patient_id' => $patient->id,
        'appointment_id' => null,
        'consultation_id' => null,
        'discount' => 0,
        'tax' => 0,
        'items' => [
            [
                'item_type' => BillingItem::TYPE_CONSULTATION,
                'description' => 'Consultation fee',
                'quantity' => 1,
                'unit_price' => 1000,
            ],
            [
                'item_type' => BillingItem::TYPE_OTHER,
                'description' => 'Clinic supplies',
                'quantity' => 2,
                'unit_price' => 250,
            ],
        ],
        ...$overrides,
    ];
}

/** @param array<string, mixed> $overrides */
function billingWithItem(array $overrides = []): Billing
{
    $billing = Billing::factory()->create($overrides);
    BillingItem::factory()->create([
        'billing_id' => $billing->id,
        'item_type' => BillingItem::TYPE_CONSULTATION,
        'description' => 'Consultation fee',
        'quantity' => 1,
        'unit_price' => $billing->grand_total,
        'total_price' => $billing->grand_total,
    ]);

    return $billing;
}

/** @param list<string> $permissions */
function billingUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }

    $user->givePermissionTo($permissions);

    return $user;
}
