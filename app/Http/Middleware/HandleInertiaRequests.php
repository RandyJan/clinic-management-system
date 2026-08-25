<?php

namespace App\Http\Middleware;

use App\Models\ClinicMembership;
use App\Models\User;
use App\Services\ClinicSettingsService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'clinic' => fn () => app(ClinicSettingsService::class)->publicData(),
            'auth' => [
                'user' => $user,
                'roles' => $user?->getRoleNames()->values() ?? [],
                'permissions' => $user?->getAllPermissions()->pluck('name')->values() ?? [],
                'current_clinic' => fn () => $this->currentClinic($request, $user),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{id: int, name: string}|null
     */
    private function currentClinic(Request $request, ?User $user): ?array
    {
        if ($user === null || $user->hasRole('Platform Administrator')) {
            return null;
        }

        $memberships = $user->clinicMemberships()
            ->where('status', ClinicMembership::STATUS_ACTIVE)
            ->whereHas('clinic', fn ($query) => $query->where('status', 'active'))
            ->with('clinic:id,name')
            ->get();

        $selectedClinicId = $request->session()->get('current_clinic_id');
        $membership = $memberships->firstWhere('clinic_id', $selectedClinicId)
            ?? $memberships->first();

        if ($membership === null) {
            return null;
        }

        $request->session()->put('current_clinic_id', $membership->clinic_id);

        return [
            'id' => $membership->clinic->id,
            'name' => $membership->clinic->name,
        ];
    }
}
