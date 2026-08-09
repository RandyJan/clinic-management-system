<?php

use App\Models\ClinicSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('admin can view and update clinic profile settings', function () {
    Storage::fake('public');

    $admin = settingsUserWithPermissions(['settings.view', 'settings.update']);

    $this->actingAs($admin)
        ->get(route('settings.clinic'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/clinic')
            ->has('settings'));

    $this->actingAs($admin)
        ->post(route('settings.clinic.update'), [
            '_method' => 'patch',
            'clinic_name' => 'Northside Family Clinic',
            'clinic_address' => '123 Health Avenue',
            'contact_number' => '+63 912 345 6789',
            'email' => 'hello@northside.test',
            'logo' => UploadedFile::fake()->image('logo.png'),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $settings = ClinicSetting::query()->firstOrFail();

    expect($settings)
        ->clinic_name->toBe('Northside Family Clinic')
        ->clinic_address->toBe('123 Health Avenue')
        ->contact_number->toBe('+63 912 345 6789')
        ->email->toBe('hello@northside.test')
        ->and($settings->logo_path)->not->toBeNull();

    Storage::disk('public')->assertExists($settings->logo_path);
});

test('admin can update billing appointment and print settings', function () {
    $admin = settingsUserWithPermissions(['settings.update']);

    $this->actingAs($admin)
        ->patch(route('settings.billing.update'), [
            'consultation_default_fee' => 750,
            'tax_rate' => 12,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->actingAs($admin)
        ->patch(route('settings.appointment.update'), [
            'appointment_slot_duration' => 20,
            'opening_time' => '08:00',
            'closing_time' => '17:00',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->actingAs($admin)
        ->patch(route('settings.print-templates.update'), [
            'receipt_footer' => 'Thank you for trusting our clinic.',
            'certificate_footer' => 'This certificate is valid only with clinic seal.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $settings = ClinicSetting::query()->firstOrFail();

    expect($settings)
        ->consultation_default_fee->toEqual('750.00')
        ->tax_rate->toEqual('12.00')
        ->appointment_slot_duration->toBe(20)
        ->receipt_footer->toBe('Thank you for trusting our clinic.')
        ->certificate_footer->toBe('This certificate is valid only with clinic seal.');
});

test('settings validation protects required numeric and schedule fields', function () {
    $admin = settingsUserWithPermissions(['settings.update']);

    $this->actingAs($admin)
        ->patch(route('settings.billing.update'), [
            'consultation_default_fee' => 'free',
            'tax_rate' => 120,
        ])
        ->assertSessionHasErrors(['consultation_default_fee', 'tax_rate']);

    $this->actingAs($admin)
        ->patch(route('settings.appointment.update'), [
            'appointment_slot_duration' => 0,
            'opening_time' => '18:00',
            'closing_time' => '08:00',
        ])
        ->assertSessionHasErrors(['appointment_slot_duration', 'closing_time']);
});

/** @param list<string> $permissions */
function settingsUserWithPermissions(array $permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }

    $user->givePermissionTo($permissions);

    return $user;
}
