<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMedicalCertificateRequest;
use App\Models\Consultation;
use App\Models\MedicalCertificate;
use App\Models\Patient;
use App\Services\MedicalCertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MedicalCertificateController extends Controller
{
    public function __construct(private readonly MedicalCertificateService $service) {}

    public function create(Consultation $consultation): Response
    {
        Gate::authorize('createMedicalCertificate', $consultation);

        return Inertia::render('medical-certificates/create', $this->service->createContext($consultation));
    }

    public function store(StoreMedicalCertificateRequest $request): RedirectResponse
    {
        $certificate = $this->service->create($request->validated(), $request->user());

        return redirect()
            ->route('medical-certificates.show', $certificate)
            ->with('success', 'Medical certificate issued.');
    }

    public function show(MedicalCertificate $medicalCertificate): Response
    {
        Gate::authorize('view', $medicalCertificate);

        return Inertia::render('medical-certificates/show', [
            'certificate' => $this->service->detail($medicalCertificate),
        ]);
    }

    public function print(MedicalCertificate $medicalCertificate): Response
    {
        Gate::authorize('view', $medicalCertificate);

        return Inertia::render('medical-certificates/print', [
            'certificate' => $this->service->detail($medicalCertificate),
        ]);
    }

    public function patient(Patient $patient): Response
    {
        Gate::authorize('viewMedicalCertificateHistory', $patient);

        return Inertia::render('medical-certificates/history', [
            'patient' => ['id' => $patient->id, 'patient_code' => $patient->patient_code, 'full_name' => $patient->full_name],
            'certificates' => $this->service->historyForPatient($patient),
        ]);
    }
}
