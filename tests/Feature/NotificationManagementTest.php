<?php

use App\Models\User;
use App\Notifications\ClinicEventNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('users only see their own notifications and can mark them as read', function () {
    $owner = notificationUser();
    $otherUser = notificationUser();

    $owner->notify(new ClinicEventNotification(
        'Unpaid bill created',
        'Invoice INV-TEST is awaiting payment.',
        ClinicEventNotification::TYPE_BILLING,
    ));

    $notification = $owner->notifications()->firstOrFail();

    $this->actingAs($owner)
        ->get(route('notifications.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('notifications/index')
            ->where('unread_count', 1)
            ->where('notifications.data.0.title', 'Unpaid bill created')
        );

    $this->actingAs($otherUser)
        ->post(route('notifications.read', $notification->id))
        ->assertNotFound();

    $this->actingAs($owner)
        ->post(route('notifications.read', $notification->id))
        ->assertRedirect();

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('latest notifications returns unread count and recent notification payloads', function () {
    $user = notificationUser();

    $user->notify(new ClinicEventNotification(
        'Laboratory result uploaded',
        'Results are now available.',
        ClinicEventNotification::TYPE_LABORATORY,
    ));

    $this->actingAs($user)
        ->get(route('notifications.latest'))
        ->assertSuccessful()
        ->assertJsonPath('unread_count', 1)
        ->assertJsonPath('notifications.0.title', 'Laboratory result uploaded')
        ->assertJsonPath('notifications.0.type', ClinicEventNotification::TYPE_LABORATORY);
});

function notificationUser(): User
{
    Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    return $user;
}
