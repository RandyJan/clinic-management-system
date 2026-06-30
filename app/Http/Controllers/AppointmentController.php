<?php

namespace App\Http\Controllers;

use App\Http\Requests\AppointmentIndexRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Http\Requests\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Services\AppointmentService;
use App\Services\ConsultationService;
use App\Services\QueueService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function __construct(
        private readonly AppointmentService $service,
        private readonly QueueService $queueService,
        private readonly ConsultationService $consultationService,
    ) {}

    public function index(AppointmentIndexRequest $request): Response
    {
        $perPage = (int) $request->input('per_page', 15);
        $filters = $request->safe()->only(['date', 'doctor_id', 'patient_id', 'status']);

        return Inertia::render('appointments/index', [
            'appointments' => $this->service->list($filters, $perPage, $request->user()),
            'filters' => $filters,
            'doctors' => $this->service->activeDoctors(),
            'patients' => $this->service->activePatients(),
            'statuses' => Appointment::STATUSES,
        ]);
    }

    public function calendar(AppointmentIndexRequest $request): Response
    {
        $filters = $request->safe()->only(['date', 'doctor_id', 'patient_id', 'status']);

        return Inertia::render('appointments/calendar', [
            'appointments' => $this->service->calendar($filters, $request->user()),
            'filters' => $filters,
            'doctors' => $this->service->activeDoctors(),
            'statuses' => Appointment::STATUSES,
        ]);
    }

    public function doctor(AppointmentIndexRequest $request): Response
    {
        $doctor = Doctor::query()->where('user_id', $request->user()?->id)->first();

        abort_unless($doctor !== null || $request->user()?->can('appointments.view'), 403);

        $filters = [
            'date' => $request->input('date', now()->toDateString()),
            'doctor_id' => $doctor?->id,
            'status' => $request->input('status'),
        ];

        return Inertia::render('appointments/index', [
            'appointments' => $this->service->list($filters, 15, $request->user()),
            'filters' => $filters,
            'doctors' => $this->service->activeDoctors(),
            'patients' => $this->service->activePatients(),
            'statuses' => Appointment::STATUSES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('appointments/create', [
            'patients' => $this->service->activePatients(),
            'doctors' => $this->service->activeDoctors(),
            'statuses' => Appointment::STATUSES,
        ]);
    }

    public function store(StoreAppointmentRequest $request): RedirectResponse
    {
        $appointment = $this->service->create($request->validated(), $request->user());

        return redirect()
            ->route('appointments.show', $appointment)
            ->with('success', "Appointment {$appointment->appointment_number} created.");
    }

    public function show(Appointment $appointment): Response
    {
        $this->authorizeAppointmentView($appointment);

        return Inertia::render('appointments/show', $this->service->profile($appointment));
    }

    public function edit(Appointment $appointment): Response
    {
        return Inertia::render('appointments/edit', [
            'appointment' => $this->service->detail($appointment),
            'patients' => $this->service->activePatients(),
            'doctors' => $this->service->activeDoctors(),
            'statuses' => Appointment::STATUSES,
        ]);
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        $this->service->update($appointment, $request->validated(), $request->user());

        return redirect()
            ->route('appointments.show', $appointment)
            ->with('success', 'Appointment updated.');
    }

    public function checkIn(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $queue = $this->queueService->checkIn([
            'appointment_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'queue_date' => $appointment->appointment_date?->toDateString(),
        ], $request->user());

        return redirect()
            ->route('queues.index', ['queue_date' => $queue->queue_date?->toDateString()])
            ->with('success', "Patient checked in as {$queue->queue_number}.");
    }

    public function start(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $this->authorizeDoctorAction($appointment);

        if ($appointment->queue !== null) {
            $this->queueService->startConsultation($appointment->queue, $request->user());
        } else {
            $this->service->startConsultation($appointment, $request->user());
        }

        $consultation = $this->consultationService->startFromAppointment($appointment->refresh(), $request->user());

        return redirect()
            ->route('consultations.edit', $consultation)
            ->with('success', 'Consultation started.');
    }

    public function complete(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $this->authorizeDoctorAction($appointment);

        if ($appointment->queue !== null) {
            $this->queueService->complete($appointment->queue, $request->user());
        } else {
            $this->service->complete($appointment, $request->user());
        }

        return back()->with('success', 'Consultation completed.');
    }

    public function cancel(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        if ($appointment->queue !== null) {
            $this->queueService->cancel($appointment->queue, $request->user());
        } else {
            $this->service->cancel($appointment, $request->user(), $request->string('remarks')->toString() ?: null);
        }

        return back()->with('success', 'Appointment cancelled.');
    }

    private function authorizeAppointmentView(Appointment $appointment): void
    {
        $user = request()->user();
        $doctor = Doctor::query()->where('user_id', $user?->id)->first();

        abort_unless(
            $user?->can('appointments.view') || $doctor?->id === $appointment->doctor_id,
            403
        );
    }

    private function authorizeDoctorAction(Appointment $appointment): void
    {
        $user = request()->user();
        $doctor = Doctor::query()->where('user_id', $user?->id)->first();

        abort_unless(
            $user?->can('appointments.update') || $doctor?->id === $appointment->doctor_id,
            403
        );
    }
}
