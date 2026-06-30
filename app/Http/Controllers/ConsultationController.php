<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompleteConsultationRequest;
use App\Http\Requests\UpdateConsultationRequest;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Services\ConsultationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ConsultationController extends Controller
{
    public function __construct(private readonly ConsultationService $service) {}

    public function show(Consultation $consultation): Response
    {
        $this->authorizeConsultationView($consultation);

        return Inertia::render('consultations/show', [
            'consultation' => $this->service->detail($consultation),
        ]);
    }

    public function edit(Consultation $consultation): Response
    {
        $this->authorizeConsultationUpdate($consultation);

        return Inertia::render('consultations/form', $this->service->formData($consultation));
    }

    public function update(UpdateConsultationRequest $request, Consultation $consultation): RedirectResponse
    {
        $this->authorizeConsultationUpdate($consultation);

        $this->service->update($consultation, $request->validated(), $request->user());

        return redirect()
            ->route('consultations.edit', $consultation)
            ->with('success', 'Consultation updated.');
    }

    public function complete(CompleteConsultationRequest $request, Consultation $consultation): RedirectResponse
    {
        $this->authorizeConsultationUpdate($consultation);

        $this->service->complete($consultation, $request->validated(), $request->user());

        return redirect()
            ->route('consultations.show', $consultation)
            ->with('success', 'Consultation completed.');
    }

    public function patient(Patient $patient): Response
    {
        return Inertia::render('consultations/history', [
            'patient' => [
                'id' => $patient->id,
                'patient_code' => $patient->patient_code,
                'full_name' => $patient->full_name,
            ],
            'consultations' => $this->service->patientHistory($patient),
        ]);
    }

    private function authorizeConsultationView(Consultation $consultation): void
    {
        $user = request()->user();
        $doctor = Doctor::query()->where('user_id', $user?->id)->first();

        abort_unless(
            $user?->can('consultations.manage')
                || $doctor?->id === $consultation->doctor_id
                || $user?->can('consultations.view'),
            403
        );
    }

    private function authorizeConsultationUpdate(Consultation $consultation): void
    {
        $user = request()->user();
        $doctor = Doctor::query()->where('user_id', $user?->id)->first();

        abort_unless(
            $user?->can('consultations.manage') || $doctor?->id === $consultation->doctor_id,
            403
        );
    }
}
