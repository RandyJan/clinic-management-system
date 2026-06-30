<?php

namespace App\Http\Controllers;

use App\Http\Requests\DispensePrescriptionRequest;
use App\Http\Requests\PrescriptionIndexRequest;
use App\Http\Requests\StorePrescriptionRequest;
use App\Models\Consultation;
use App\Models\Patient;
use App\Models\Prescription;
use App\Services\PrescriptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PrescriptionController extends Controller
{
    public function __construct(private readonly PrescriptionService $service) {}

    public function index(PrescriptionIndexRequest $request): Response
    {
        $filters = $request->safe()->only(['search', 'status']);

        return Inertia::render('prescriptions/index', [
            'prescriptions' => $this->service->list($request->user(), $filters, (int) $request->input('per_page', 15)),
            'filters' => $filters,
        ]);
    }

    public function pending(PrescriptionIndexRequest $request): Response
    {
        $filters = ['search' => $request->validated('search'), 'status' => Prescription::STATUS_PENDING];

        return Inertia::render('prescriptions/pending', [
            'prescriptions' => $this->service->list($request->user(), $filters, (int) $request->input('per_page', 15)),
            'filters' => ['search' => $filters['search']],
        ]);
    }

    public function create(Consultation $consultation): Response
    {
        Gate::authorize('createPrescription', $consultation);

        return Inertia::render('prescriptions/create', $this->service->createContext($consultation));
    }

    public function store(StorePrescriptionRequest $request): RedirectResponse
    {
        $prescription = $this->service->create($request->validated(), $request->user());

        return redirect()->route('prescriptions.show', $prescription)->with('success', 'Prescription created.');
    }

    public function show(Prescription $prescription): Response
    {
        Gate::authorize('view', $prescription);

        return Inertia::render('prescriptions/show', ['prescription' => $this->service->detail($prescription)]);
    }

    public function print(Prescription $prescription): Response
    {
        Gate::authorize('view', $prescription);

        return Inertia::render('prescriptions/print', ['prescription' => $this->service->detail($prescription)]);
    }

    public function dispense(DispensePrescriptionRequest $request, Prescription $prescription): RedirectResponse
    {
        $this->service->dispense($prescription, $request->user());

        return back()->with('success', 'Prescription dispensed and inventory updated.');
    }

    public function patient(PrescriptionIndexRequest $request, Patient $patient): Response
    {
        Gate::authorize('viewPatientHistory', [Prescription::class, $patient]);

        return Inertia::render('prescriptions/history', [
            'patient' => ['id' => $patient->id, 'patient_code' => $patient->patient_code, 'full_name' => $patient->full_name],
            'prescriptions' => $this->service->list($request->user(), [
                'patient_id' => $patient->id,
                'search' => $request->validated('search'),
            ], 100),
        ]);
    }
}
