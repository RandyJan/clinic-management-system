<?php

namespace App\Providers;

use App\Models\Patient;
use App\Policies\LaboratoryRequestPolicy;
use App\Policies\MedicalRecordPolicy;
use App\Policies\PrescriptionPolicy;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Patient::class, MedicalRecordPolicy::class);
        Gate::define('createPrescription', [PrescriptionPolicy::class, 'createPrescription']);
        Gate::define('createLabRequest', [LaboratoryRequestPolicy::class, 'createLabRequest']);

        Event::listen(Login::class, function (Login $event): void {
            activity('authentication')
                ->causedBy($event->user)
                ->withProperties([
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ])
                ->event('login')
                ->log('User logged in');
        });

        Event::listen(Logout::class, function (Logout $event): void {
            if ($event->user === null) {
                return;
            }

            activity('authentication')
                ->causedBy($event->user)
                ->withProperties([
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ])
                ->event('logout')
                ->log('User logged out');
        });
    }
}
