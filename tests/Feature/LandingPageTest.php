<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests can view the landing page', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('landing')
            ->where('canRegister', true));
});

test('authenticated users are redirected to the dashboard', function () {
    $user = User::factory()->withoutTwoFactor()->create();

    $this->actingAs($user)
        ->get(route('home'))
        ->assertRedirect(route('dashboard'));
});
