<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\ClinicQueue;
use App\Models\Consultation;
use App\Models\LaboratoryRequest;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ConsultationService
{
    public function __construct(
        private readonly PrescriptionService $prescriptionService,
        private readonly LaboratoryRequestService $laboratoryRequestService,
    ) {}

    public function startFromAppointment(Appointment $appointment, User $actor): Consultation
    {
        return DB::transaction(function () use ($appointment, $actor): Consultation {
            $consultation = Consultation::query()
                ->where('appointment_id', $appointment->id)
                ->first();

            if ($consultation !== null) {
                return $consultation;
            }

            $consultation = $this->createWithUniqueNumber([
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
                'status' => Consultation::STATUS_IN_PROGRESS,
                'started_at' => now(),
            ]);

            $appointment->forceFill([
                'status' => Appointment::STATUS_IN_CONSULTATION,
            ])->save();

            activity('consultation-management')
                ->causedBy($actor)
                ->performedOn($consultation)
                ->event('created')
                ->log('Started consultation');

            return $consultation;
        });
    }

    public function startFromQueue(ClinicQueue $queue, User $actor): Consultation
    {
        $queue->loadMissing('appointment');

        if ($queue->appointment === null) {
            throw ValidationException::withMessages([
                'appointment_id' => 'A queue item must be linked to an appointment before consultation can start.',
            ]);
        }

        return $this->startFromAppointment($queue->appointment, $actor);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Consultation $consultation, array $data, User $actor): Consultation
    {
        return DB::transaction(function () use ($consultation, $data, $actor): Consultation {
            $consultation->fill($this->consultationAttributes($data));
            $consultation->save();

            $this->upsertPrescription($consultation, $data);
            $this->upsertLaboratoryRequest($consultation, $data);

            activity('consultation-management')
                ->causedBy($actor)
                ->performedOn($consultation)
                ->event('updated')
                ->log('Updated consultation');

            return $consultation;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function complete(Consultation $consultation, array $data, User $actor): Consultation
    {
        return DB::transaction(function () use ($consultation, $data, $actor): Consultation {
            $this->update($consultation, $data, $actor);

            $consultation->forceFill([
                'status' => Consultation::STATUS_COMPLETED,
                'completed_at' => now(),
            ])->save();

            $consultation->appointment?->forceFill([
                'status' => Appointment::STATUS_COMPLETED,
            ])->save();

            activity('consultation-management')
                ->causedBy($actor)
                ->performedOn($consultation)
                ->withProperties(['status' => Consultation::STATUS_COMPLETED])
                ->event('updated')
                ->log('Completed consultation');

            return $consultation;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function formData(Consultation $consultation): array
    {
        $consultation->loadMissing([
            'appointment.patient',
            'doctor',
            'patient',
            'prescriptions',
            'laboratoryRequests',
        ]);

        return [
            'consultation' => $this->detail($consultation),
            'medical_history' => $this->patientHistory($consultation->patient),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(Consultation $consultation): array
    {
        $consultation->loadMissing([
            'appointment',
            'patient',
            'doctor',
            'prescriptions',
            'laboratoryRequests',
        ]);

        return [
            'id' => $consultation->id,
            'consultation_number' => $consultation->consultation_number,
            'appointment_id' => $consultation->appointment_id,
            'patient_id' => $consultation->patient_id,
            'doctor_id' => $consultation->doctor_id,
            'chief_complaint' => $consultation->chief_complaint,
            'history_of_present_illness' => $consultation->history_of_present_illness,
            'diagnosis' => $consultation->diagnosis,
            'treatment_plan' => $consultation->treatment_plan,
            'doctor_notes' => $consultation->doctor_notes,
            'follow_up_date' => $consultation->follow_up_date?->toDateString(),
            'status' => $consultation->status,
            'started_at' => $consultation->started_at?->toIso8601String(),
            'completed_at' => $consultation->completed_at?->toIso8601String(),
            'created_at' => $consultation->created_at?->toIso8601String(),
            'updated_at' => $consultation->updated_at?->toIso8601String(),
            'appointment' => [
                'id' => $consultation->appointment->id,
                'appointment_number' => $consultation->appointment->appointment_number,
                'appointment_date' => $consultation->appointment->appointment_date?->toDateString(),
                'appointment_time' => $consultation->appointment->appointment_time?->format('H:i'),
            ],
            'patient' => [
                'id' => $consultation->patient->id,
                'full_name' => $consultation->patient->full_name,
                'patient_code' => $consultation->patient->patient_code,
            ],
            'doctor' => [
                'id' => $consultation->doctor->id,
                'full_name' => $consultation->doctor->full_name,
                'specialization' => $consultation->doctor->specialization,
            ],
            'prescriptions' => $consultation->prescriptions->map(fn (Prescription $prescription): array => [
                'id' => $prescription->id,
                'medications' => $prescription->medications,
                'instructions' => $prescription->instructions,
            ])->values(),
            'laboratory_requests' => $consultation->laboratoryRequests->map(fn (LaboratoryRequest $request): array => [
                'id' => $request->id,
                'tests' => $request->tests,
                'instructions' => $request->instructions,
                'status' => $request->status,
            ])->values(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function patientHistory(Patient $patient): Collection
    {
        return Consultation::query()
            ->with(['appointment:id,appointment_number,appointment_date,appointment_time', 'doctor:id,first_name,last_name,specialization'])
            ->where('patient_id', $patient->id)
            ->where('status', Consultation::STATUS_COMPLETED)
            ->latest('completed_at')
            ->get()
            ->map(fn (Consultation $consultation): array => [
                'id' => $consultation->id,
                'consultation_number' => $consultation->consultation_number,
                'appointment_id' => $consultation->appointment_id,
                'diagnosis' => $consultation->diagnosis,
                'follow_up_date' => $consultation->follow_up_date?->toDateString(),
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
                ],
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function consultationAttributes(array $data): array
    {
        return collect($data)
            ->only([
                'chief_complaint',
                'history_of_present_illness',
                'diagnosis',
                'treatment_plan',
                'doctor_notes',
                'follow_up_date',
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upsertPrescription(Consultation $consultation, array $data): void
    {
        $this->prescriptionService->upsertLegacyPrescription($consultation, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upsertLaboratoryRequest(Consultation $consultation, array $data): void
    {
        $this->laboratoryRequestService->upsertLegacyRequest($consultation, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createWithUniqueNumber(array $data): Consultation
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return Consultation::create([
                    ...$data,
                    'consultation_number' => $this->generateConsultationNumber(),
                ]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return Consultation::create([
            ...$data,
            'consultation_number' => $this->generateConsultationNumber(),
        ]);
    }

    private function generateConsultationNumber(): string
    {
        do {
            $number = 'CON-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Consultation::query()->where('consultation_number', $number)->exists());

        return $number;
    }
}
