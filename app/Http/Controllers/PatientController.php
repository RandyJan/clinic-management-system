<?php

namespace App\Http\Controllers;

use App\Http\Requests\PatientIndexRequest;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Http\Requests\UpdatePatientStatusRequest;
use App\Models\Patient;
use App\Services\PatientService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function __construct(private readonly PatientService $service) {}

    public function index(PatientIndexRequest $request): Response
    {
        $perPage = (int) $request->input('per_page', 15);
        $filters = $request->safe()->only(['search', 'status']);

        return Inertia::render('patients/index', [
            'patients' => $this->service->list($filters, $perPage),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('patients/create');
    }

    public function store(StorePatientRequest $request): RedirectResponse
    {
        $patient = $this->service->create($request->validated(), $request->user());

        return redirect()
            ->route('patients.show', $patient)
            ->with('success', 'Patient registered successfully.');
    }

    public function show(Patient $patient): Response
    {
        return Inertia::render('patients/show', $this->service->profile($patient));
    }

    public function edit(Patient $patient): Response
    {
        return Inertia::render('patients/edit', [
            'patient' => $this->service->detail($patient),
        ]);
    }

    public function update(UpdatePatientRequest $request, Patient $patient): RedirectResponse
    {
        $this->service->update($patient, $request->validated(), $request->user());

        return redirect()
            ->route('patients.show', $patient)
            ->with('success', 'Patient details updated.');
    }

    public function deactivate(UpdatePatientStatusRequest $request, Patient $patient): RedirectResponse
    {
        $this->service->deactivate($patient, $request->user());

        return redirect()
            ->route('patients.show', $patient)
            ->with('success', 'Patient record deactivated.');
    }

    public function history(Patient $patient): Response
    {
        return Inertia::render('patients/history', [
            'patient' => $this->service->detail($patient),
            'medical_history' => $this->service->medicalHistory($patient),
        ]);
    }
}
