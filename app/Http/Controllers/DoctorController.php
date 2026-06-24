<?php

namespace App\Http\Controllers;

use App\Http\Requests\DoctorIndexRequest;
use App\Http\Requests\StoreDoctorRequest;
use App\Http\Requests\UpdateDoctorRequest;
use App\Models\Doctor;
use App\Services\DoctorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DoctorController extends Controller
{
    public function __construct(private readonly DoctorService $service) {}

    public function index(DoctorIndexRequest $request): Response
    {
        $perPage = (int) $request->input('per_page', 15);
        $filters = $request->safe()->only(['search', 'status', 'specialization']);

        return Inertia::render('doctors/index', [
            'doctors' => $this->service->list($filters, $perPage),
            'filters' => $filters,
            'specializations' => $this->service->specializations(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('doctors/create', [
            'users' => $this->service->availableUsers(),
        ]);
    }

    public function store(StoreDoctorRequest $request): RedirectResponse
    {
        $doctor = $this->service->create($request->validated(), $request->user());

        return redirect()
            ->route('doctors.show', $doctor)
            ->with('success', 'Doctor profile created successfully.');
    }

    public function show(Doctor $doctor): Response
    {
        $this->authorizeProfileView($doctor);

        return Inertia::render('doctors/show', $this->service->profile($doctor));
    }

    public function edit(Doctor $doctor): Response
    {
        return Inertia::render('doctors/edit', [
            'doctor' => $this->service->detail($doctor->loadMissing('user')),
            'users' => $this->service->availableUsers($doctor),
        ]);
    }

    public function update(UpdateDoctorRequest $request, Doctor $doctor): RedirectResponse
    {
        $this->service->update($doctor, $request->validated(), $request->user());

        return redirect()
            ->route('doctors.show', $doctor)
            ->with('success', 'Doctor profile updated.');
    }

    public function schedule(Doctor $doctor): Response
    {
        $this->authorizeProfileView($doctor);

        return Inertia::render('doctors/schedule', $this->service->profile($doctor));
    }

    public function assignmentOptions(): JsonResponse
    {
        return response()->json([
            'doctors' => $this->service->activeAssignmentOptions(),
        ]);
    }

    private function authorizeProfileView(Doctor $doctor): void
    {
        $user = request()->user();

        abort_unless(
            $user?->can('doctors.view') || $doctor->user_id === $user?->id,
            403
        );
    }
}
