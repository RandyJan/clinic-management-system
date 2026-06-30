<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVitalSignRequest;
use App\Models\Appointment;
use App\Models\Patient;
use App\Services\VitalSignService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class VitalSignController extends Controller
{
    public function __construct(private readonly VitalSignService $service) {}

    public function create(Appointment $appointment): Response
    {
        return Inertia::render('vital-signs/create', $this->service->recordContext($appointment));
    }

    public function store(StoreVitalSignRequest $request): RedirectResponse
    {
        $vitalSign = $this->service->create($request->validated(), $request->user());

        return redirect()
            ->route('appointments.vital-signs.show', $vitalSign->appointment_id)
            ->with('success', 'Vital signs recorded.');
    }

    public function appointment(Appointment $appointment): Response
    {
        return Inertia::render('vital-signs/appointment', $this->service->appointmentView($appointment));
    }

    public function patient(Patient $patient): Response
    {
        return Inertia::render('vital-signs/history', $this->service->patientHistory($patient));
    }
}
