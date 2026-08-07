<?php

use App\Models\Billing;
use App\Models\BillingItem;
use App\Models\Patient;
use App\Models\Service;
use App\Models\ServicePriceHistory;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('admin can create and update clinic services with price history', function () {
    $admin = serviceUserWithPermissions(['services.view', 'services.create', 'services.update']);

    $this->actingAs($admin)
        ->get(route('services.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('services/index')
            ->has('categories'));

    $this->actingAs($admin)
        ->post(route('services.store'), [
            'name' => 'General Consultation',
            'description' => 'Standard clinic consultation',
            'category' => Service::CATEGORY_CONSULTATION,
            'price' => 500,
            'status' => Service::STATUS_ACTIVE,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $service = Service::query()->latest('id')->firstOrFail();

    expect($service)
        ->service_code->toStartWith('SVC-')
        ->name->toBe('General Consultation')
        ->price->toEqual('500.00');

    $this->actingAs($admin)
        ->put(route('services.update', $service), [
            'name' => 'General Consultation',
            'description' => 'Updated fee',
            'category' => Service::CATEGORY_CONSULTATION,
            'price' => 650,
            'status' => Service::STATUS_ACTIVE,
        ])
        ->assertRedirect(route('services.edit', $service))
        ->assertSessionHasNoErrors();

    $history = ServicePriceHistory::query()->firstOrFail();

    expect($service->fresh()->price)->toEqual('650.00')
        ->and($history->old_price)->toEqual('500.00')
        ->and($history->new_price)->toEqual('650.00')
        ->and($history->changed_by)->toBe($admin->id);
});

test('service validation requires name category and numeric price', function () {
    $admin = serviceUserWithPermissions(['services.create']);

    $this->actingAs($admin)
        ->post(route('services.store'), [
            'name' => '',
            'category' => '',
            'price' => 'free',
        ])
        ->assertSessionHasErrors(['name', 'category', 'price']);
});

test('cashier can use active services in billing and inactive services are rejected', function () {
    $cashier = serviceUserWithPermissions(['billing.view', 'billing.create']);
    $patient = Patient::factory()->create();
    $activeService = Service::factory()->create([
        'name' => 'CBC',
        'category' => Service::CATEGORY_LABORATORY,
        'price' => 350,
    ]);
    $inactiveService = Service::factory()->inactive()->create([
        'name' => 'Old X-Ray Charge',
        'category' => Service::CATEGORY_PROCEDURE,
        'price' => 900,
    ]);

    $this->actingAs($cashier)
        ->get(route('billings.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('billings/create')
            ->where('services.0.id', $activeService->id));

    $this->actingAs($cashier)
        ->post(route('billings.store'), [
            'patient_id' => $patient->id,
            'discount' => 0,
            'tax' => 0,
            'items' => [[
                'service_id' => $activeService->id,
                'item_type' => BillingItem::TYPE_OTHER,
                'description' => 'Tampered description',
                'quantity' => 2,
                'unit_price' => 1,
            ]],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $billing = Billing::query()->latest('id')->firstOrFail();
    $item = $billing->items()->firstOrFail();

    expect($item)
        ->service_id->toBe($activeService->id)
        ->item_type->toBe(Service::CATEGORY_LABORATORY)
        ->description->toBe('CBC')
        ->unit_price->toEqual('350.00')
        ->total_price->toEqual('700.00');

    $this->actingAs($cashier)
        ->post(route('billings.store'), [
            'patient_id' => $patient->id,
            'discount' => 0,
            'tax' => 0,
            'items' => [[
                'service_id' => $inactiveService->id,
                'item_type' => BillingItem::TYPE_OTHER,
                'description' => 'Inactive service',
                'quantity' => 1,
                'unit_price' => 900,
            ]],
        ])
        ->assertSessionHasErrors(['items.0.service_id']);
});

/** @param list<string> $permissions */
function serviceUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }

    $user->givePermissionTo($permissions);

    return $user;
}
