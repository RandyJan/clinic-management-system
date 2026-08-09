<?php

use App\Http\Controllers\Settings\ClinicSettingsController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::get('settings/clinic', [ClinicSettingsController::class, 'clinic'])
        ->middleware('can:settings.view')
        ->name('settings.clinic');
    Route::patch('settings/clinic', [ClinicSettingsController::class, 'updateClinic'])
        ->middleware('can:settings.update')
        ->name('settings.clinic.update');

    Route::get('settings/billing', [ClinicSettingsController::class, 'billing'])
        ->middleware('can:settings.view')
        ->name('settings.billing');
    Route::patch('settings/billing', [ClinicSettingsController::class, 'updateBilling'])
        ->middleware('can:settings.update')
        ->name('settings.billing.update');

    Route::get('settings/appointment', [ClinicSettingsController::class, 'appointment'])
        ->middleware('can:settings.view')
        ->name('settings.appointment');
    Route::patch('settings/appointment', [ClinicSettingsController::class, 'updateAppointment'])
        ->middleware('can:settings.update')
        ->name('settings.appointment.update');

    Route::get('settings/print-templates', [ClinicSettingsController::class, 'printTemplates'])
        ->middleware('can:settings.view')
        ->name('settings.print-templates');
    Route::patch('settings/print-templates', [ClinicSettingsController::class, 'updatePrintTemplates'])
        ->middleware('can:settings.update')
        ->name('settings.print-templates.update');
});
