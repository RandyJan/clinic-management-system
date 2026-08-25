<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\LoginResponse;
use App\Http\Responses\PendingApprovalRegisterResponse;
use App\Models\Clinic;
use App\Models\User;
use App\Services\FirstLoginBootstrapService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\RegisterResponse;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponseContract::class, LoginResponse::class);
        $this->app->singleton(RegisterResponse::class, PendingApprovalRegisterResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);

        // Keep the custom callback so account approval is enforced at login.
        Fortify::authenticateUsing(function (Request $request) {
            $request->validate([
                config('fortify.username') => ['required', 'string'],
                'password' => ['required', 'string'],
            ]);

            $credentials = [
                config('fortify.username') => $request->input(config('fortify.username')),
                'password' => $request->input('password'),
            ];

            if (Auth::attempt($credentials, $request->boolean('remember'))) {
                return $this->validatedAuthenticatedUser();
            }

            return null;
        });
    }

    private function validatedAuthenticatedUser(): ?User
    {
        $authenticatedUser = Auth::user();

        if (! $authenticatedUser instanceof User) {
            return null;
        }

        $authenticatedUser = app(FirstLoginBootstrapService::class)->bootstrap($authenticatedUser);

        if (! $authenticatedUser->is_active) {
            Auth::logout();

            throw ValidationException::withMessages([
                config('fortify.username') => 'Your account is pending administrator approval or has been deactivated.',
            ]);
        }

        return $authenticatedUser;
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => true,
            'canRegister' => true,
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'clinics' => Clinic::query()
                ->where('status', Clinic::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->input('email'),
            'token' => $request->route('token'),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
