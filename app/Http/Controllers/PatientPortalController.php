<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePatientPortalAppointmentRequest;
use App\Http\Requests\UpdatePatientPortalContactRequest;
use App\Models\Appointment;
use App\Models\Billing;
use App\Models\Consultation;
use App\Models\MedicalCertificate;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use App\Services\AppointmentService;
use App\Services\BillingService;
use App\Services\MedicalCertificateService;
use App\Services\PatientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PatientPortalController extends Controller
{
    public function __construct(
        private readonly AppointmentService $appointmentService,
        private readonly PatientService $patientService,
        private readonly BillingService $billingService,
        private readonly MedicalCertificateService $medicalCertificateService,
    ) {}

    public function dashboard(Request $request): Response
    {
        $patient = $this->patientFor($request->user());

        return Inertia::render('patient-portal/dashboard', [
            'patient' => $this->patientService->detail($patient),
            'stats' => [
                'upcoming_appointments' => $patient->appointments()
                    ->whereDate('appointment_date', '>=', now()->toDateString())
                    ->whereNotIn('status', [Appointment::STATUS_CANCELLED, Appointment::STATUS_NO_SHOW, Appointment::STATUS_COMPLETED])
                    ->count(),
                'completed_consultations' => $patient->consultations()
                    ->where('status', Consultation::STATUS_COMPLETED)
                    ->count(),
                'pending_prescriptions' => $patient->prescriptions()
                    ->where('status', Prescription::STATUS_PENDING)
                    ->count(),
                'unpaid_bills' => $patient->billings()
                    ->whereIn('payment_status', [Billing::STATUS_UNPAID, Billing::STATUS_PARTIALLY_PAID])
                    ->count(),
            ],
            'appointments' => $this->recentAppointments($patient, 5),
            'consultations' => $this->recentConsultations($patient, 5),
            'bills' => $this->recentBillings($patient, 5),
        ]);
    }

    public function appointments(Request $request): Response
    {
        $patient = $this->patientFor($request->user());

        return Inertia::render('patient-portal/appointments', [
            'appointments' => Appointment::query()
                ->whereBelongsTo($patient)
                ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name,specialization'])
                ->latest('appointment_date')
                ->latest('appointment_time')
                ->paginate((int) $request->input('per_page', 15))
                ->withQueryString()
                ->through(fn (Appointment $appointment): array => $this->appointmentService->summary($appointment)),
        ]);
    }

    public function createAppointment(Request $request): Response
    {
        $this->patientFor($request->user());

        return Inertia::render('patient-portal/request-appointment', [
            'doctors' => $this->appointmentService->activeDoctors(),
            'appointment_types' => ['Consultation', 'Follow-up', 'Laboratory', 'Procedure', 'Other'],
        ]);
    }

    public function storeAppointment(StorePatientPortalAppointmentRequest $request): RedirectResponse
    {
        $patient = $this->patientFor($request->user());
        $appointment = $this->appointmentService->create([
            ...$request->validated(),
            'patient_id' => $patient->id,
        ], $request->user());

        return redirect()
            ->route('patient-portal.appointments')
            ->with('success', "Appointment request {$appointment->appointment_number} submitted.");
    }

    public function records(Request $request): Response
    {
        $patient = $this->patientFor($request->user());

        return Inertia::render('patient-portal/medical-records', [
            'patient' => $this->patientService->detail($patient),
            'consultations' => $this->recentConsultations($patient, 25),
            'certificates' => $this->recentCertificates($patient, 25),
        ]);
    }

    public function prescriptions(Request $request): Response
    {
        $patient = $this->patientFor($request->user());

        return Inertia::render('patient-portal/prescriptions', [
            'prescriptions' => $patient->prescriptions()
                ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name,specialization'])
                ->withCount('items')
                ->latest()
                ->paginate((int) $request->input('per_page', 15))
                ->withQueryString()
                ->through(fn (Prescription $prescription): array => [
                    'id' => $prescription->id,
                    'prescription_number' => $prescription->prescription_number ?? 'Legacy prescription',
                    'consultation_id' => $prescription->consultation_id,
                    'patient_id' => $prescription->patient_id,
                    'doctor_id' => $prescription->doctor_id,
                    'status' => $prescription->status,
                    'items_count' => $prescription->items_count,
                    'created_at' => $prescription->created_at?->toIso8601String(),
                    'updated_at' => $prescription->updated_at?->toIso8601String(),
                    'dispensed_at' => $prescription->dispensed_at?->toIso8601String(),
                    'patient' => [
                        'id' => $prescription->patient->id,
                        'patient_code' => $prescription->patient->patient_code,
                        'full_name' => $prescription->patient->full_name,
                    ],
                    'doctor' => [
                        'id' => $prescription->doctor->id,
                        'full_name' => $prescription->doctor->full_name,
                        'specialization' => $prescription->doctor->specialization,
                    ],
                ]),
        ]);
    }

    public function labResults(Request $request): Response
    {
        $patient = $this->patientFor($request->user());

        return Inertia::render('patient-portal/lab-results', [
            'laboratory_requests' => $patient->laboratoryRequests()
                ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name,specialization'])
                ->withExists('labResult')
                ->latest('requested_at')
                ->paginate((int) $request->input('per_page', 15))
                ->withQueryString()
                ->through(fn ($laboratoryRequest): array => [
                    'id' => $laboratoryRequest->id,
                    'lab_request_number' => $laboratoryRequest->lab_request_number ?? 'Legacy lab request',
                    'consultation_id' => $laboratoryRequest->consultation_id,
                    'patient_id' => $laboratoryRequest->patient_id,
                    'doctor_id' => $laboratoryRequest->doctor_id,
                    'requested_tests' => $laboratoryRequest->requested_tests ?? str((string) $laboratoryRequest->tests)->split('/[\r\n,]+/')->filter()->values()->all(),
                    'status' => $laboratoryRequest->status,
                    'has_result' => (bool) ($laboratoryRequest->lab_result_exists ?? $laboratoryRequest->labResult?->exists),
                    'requested_at' => $laboratoryRequest->requested_at?->toIso8601String() ?? $laboratoryRequest->created_at?->toIso8601String(),
                    'completed_at' => $laboratoryRequest->completed_at?->toIso8601String(),
                    'created_at' => $laboratoryRequest->created_at?->toIso8601String(),
                    'updated_at' => $laboratoryRequest->updated_at?->toIso8601String(),
                    'patient' => [
                        'id' => $laboratoryRequest->patient->id,
                        'patient_code' => $laboratoryRequest->patient->patient_code,
                        'full_name' => $laboratoryRequest->patient->full_name,
                    ],
                    'doctor' => [
                        'id' => $laboratoryRequest->doctor->id,
                        'full_name' => $laboratoryRequest->doctor->full_name,
                        'specialization' => $laboratoryRequest->doctor->specialization,
                    ],
                ]),
        ]);
    }

    public function bills(Request $request): Response
    {
        $patient = $this->patientFor($request->user());

        return Inertia::render('patient-portal/bills', [
            'billings' => Billing::query()
                ->whereBelongsTo($patient)
                ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'payments.receiver:id,name'])
                ->withSum('payments', 'amount_paid')
                ->latest()
                ->paginate((int) $request->input('per_page', 15))
                ->withQueryString()
                ->through(fn (Billing $billing): array => $this->billingService->detail($billing)),
        ]);
    }

    public function profile(Request $request): Response
    {
        $patient = $this->patientFor($request->user());

        return Inertia::render('patient-portal/profile', [
            'patient' => $this->patientService->detail($patient),
        ]);
    }

    public function updateProfile(UpdatePatientPortalContactRequest $request): RedirectResponse
    {
        $patient = $this->patientFor($request->user());

        $patient->fill($request->validated());
        $patient->save();

        activity('patient-portal')
            ->causedBy($request->user())
            ->performedOn($patient)
            ->event('updated')
            ->log('Updated patient contact information');

        return back()->with('success', 'Contact information updated.');
    }

    private function patientFor(?User $user): Patient
    {
        abort_unless((bool) config('clinic.patient_portal_enabled'), 404);
        abort_unless($user !== null, 403);

        $patient = $user->patient()->first();

        abort_unless($patient !== null, 403, 'Your account is not linked to a patient profile yet.');

        return $patient;
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentAppointments(Patient $patient, int $limit): Collection
    {
        return Appointment::query()
            ->whereBelongsTo($patient)
            ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name,specialization'])
            ->latest('appointment_date')
            ->latest('appointment_time')
            ->limit($limit)
            ->get()
            ->map(fn (Appointment $appointment): array => $this->appointmentService->summary($appointment));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentConsultations(Patient $patient, int $limit): Collection
    {
        return Consultation::query()
            ->whereBelongsTo($patient)
            ->with(['appointment:id,appointment_number,appointment_date,appointment_time', 'doctor:id,first_name,last_name,specialization'])
            ->latest('completed_at')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Consultation $consultation): array => [
                'id' => $consultation->id,
                'consultation_number' => $consultation->consultation_number,
                'appointment_id' => $consultation->appointment_id,
                'diagnosis' => $consultation->diagnosis,
                'treatment_plan' => $consultation->treatment_plan,
                'follow_up_date' => $consultation->follow_up_date?->toDateString(),
                'status' => $consultation->status,
                'completed_at' => $consultation->completed_at?->toIso8601String(),
                'doctor' => [
                    'id' => $consultation->doctor->id,
                    'full_name' => $consultation->doctor->full_name,
                    'specialization' => $consultation->doctor->specialization,
                ],
                'appointment' => [
                    'id' => $consultation->appointment->id,
                    'appointment_number' => $consultation->appointment->appointment_number,
                    'appointment_date' => $consultation->appointment->appointment_date?->toDateString(),
                    'appointment_time' => $consultation->appointment->appointment_time?->format('H:i'),
                ],
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentCertificates(Patient $patient, int $limit): Collection
    {
        return MedicalCertificate::query()
            ->whereBelongsTo($patient)
            ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix,birthdate,gender,address', 'consultation:id,consultation_number,chief_complaint,created_at', 'doctor:id,first_name,last_name,specialization,license_number'])
            ->latest('issued_date')
            ->limit($limit)
            ->get()
            ->map(fn (MedicalCertificate $certificate): array => [
                ...$this->medicalCertificateService->detail($certificate),
                'print_url' => route('medical-certificates.print', $certificate),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function recentBillings(Patient $patient, int $limit): Collection
    {
        return Billing::query()
            ->whereBelongsTo($patient)
            ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'payments.receiver:id,name'])
            ->withSum('payments', 'amount_paid')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Billing $billing): array => $this->billingService->detail($billing));
    }
}
