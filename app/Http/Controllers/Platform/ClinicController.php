<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StoreClinicRequest;
use App\Http\Requests\Platform\UpdateClinicRequest;
use App\Models\Clinic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClinicController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();

        $clinics = Clinic::query()
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->when(in_array($status, Clinic::STATUSES, true), fn ($query) => $query->where('status', $status))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('platform/clinics/index', [
            'clinics' => $clinics,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('platform/clinics/form');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreClinicRequest $request): RedirectResponse
    {
        $clinic = Clinic::query()->create($request->validated());

        return to_route('platform.clinics.edit', $clinic)
            ->with('success', 'Clinic created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function edit(Clinic $clinic): Response
    {
        return Inertia::render('platform/clinics/form', [
            'managedClinic' => $clinic,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateClinicRequest $request, Clinic $clinic): RedirectResponse
    {
        $clinic->update($request->validated());

        return to_route('platform.clinics.edit', $clinic)
            ->with('success', 'Clinic updated successfully.');
    }
}
