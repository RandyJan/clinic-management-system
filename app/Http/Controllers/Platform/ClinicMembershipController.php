<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StoreClinicMembershipRequest;
use App\Http\Requests\Platform\UpdateClinicMembershipRequest;
use App\Models\Clinic;
use App\Models\ClinicMembership;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class ClinicMembershipController extends Controller
{
    public function index(Clinic $clinic): Response
    {
        return Inertia::render('platform/clinics/members', [
            'managedClinic' => $clinic,
            'memberships' => ClinicMembership::query()
                ->whereBelongsTo($clinic)
                ->with(['user:id,name,email,username,is_active', 'role:id,name'])
                ->latest('id')
                ->get(),
            'availableUsers' => User::query()
                ->where('is_active', true)
                ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'Platform Administrator'))
                ->whereDoesntHave('clinics', fn ($query) => $query->whereKey($clinic->id))
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'username']),
            'roles' => Role::query()
                ->where('guard_name', 'web')
                ->where('name', '!=', 'Platform Administrator')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreClinicMembershipRequest $request, Clinic $clinic): RedirectResponse
    {
        $clinic->memberships()->create($request->validated());

        return back()->with('success', 'Clinic member added successfully.');
    }

    public function update(
        UpdateClinicMembershipRequest $request,
        Clinic $clinic,
        ClinicMembership $membership
    ): RedirectResponse {
        $this->ensureMembershipBelongsToClinic($membership, $clinic);
        $membership->update($request->validated());

        return back()->with('success', 'Clinic membership updated successfully.');
    }

    public function destroy(Clinic $clinic, ClinicMembership $membership): RedirectResponse
    {
        $this->ensureMembershipBelongsToClinic($membership, $clinic);
        $membership->delete();

        return back()->with('success', 'Clinic member removed successfully.');
    }

    private function ensureMembershipBelongsToClinic(ClinicMembership $membership, Clinic $clinic): void
    {
        abort_unless($membership->clinic_id === $clinic->id, 404);
    }
}
