<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\LaboratoryRequest;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class MedicalRecordService
{
    /**
     * @param  array{search?: string|null}  $filters
     */
    public function list(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Patient::query()
            ->select([
                'id',
                'user_id',
                'patient_code',
                'first_name',
                'middle_name',
                'last_name',
                'suffix',
                'birthdate',
                'gender',
                'contact_number',
                'updated_at',
            ])
            ->withCount(['consultations', 'vitalSigns'])
            ->withMax('consultations', 'completed_at')
            ->latest('updated_at');

        $this->scopeForActor($query, $actor);

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search): void {
                $query->where('patient_code', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        return $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Patient $patient): array => [
                'id' => $patient->id,
                'patient_code' => $patient->patient_code,
                'full_name' => $patient->full_name,
                'birthdate' => $patient->birthdate?->toDateString(),
                'age' => $patient->age,
                'gender' => $patient->gender,
                'contact_number' => $patient->contact_number,
                'consultations_count' => $patient->consultations_count,
                'vital_signs_count' => $patient->vital_signs_count,
                'last_consultation_at' => $patient->consultations_max_completed_at,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function record(Patient $patient): array
    {
        $patient->load([
            'consultations' => fn ($query) => $query
                ->with([
                    'appointment:id,appointment_number,appointment_date,appointment_time,reason_for_visit',
                    'doctor:id,first_name,last_name,specialization,license_number',
                    'prescriptions:id,consultation_id,prescription_number,status,medications,instructions,notes,created_at',
                    'prescriptions.items:id,prescription_id,medicine_name,dosage,frequency,duration,quantity,instructions',
                    'laboratoryRequests:id,consultation_id,lab_request_number,requested_tests,clinical_notes,tests,instructions,status,result,result_notes,resulted_at,requested_at,completed_at,created_at',
                    'laboratoryRequests.labResult:id,lab_request_id,result_details,remarks,attachment_path,uploaded_at',
                ])
                ->latest('started_at'),
            'vitalSigns' => fn ($query) => $query
                ->with(['appointment:id,appointment_number,appointment_date', 'recorder:id,name'])
                ->latest('recorded_at'),
        ]);

        $consultations = $patient->consultations->map(fn (Consultation $consultation): array => [
            'id' => $consultation->id,
            'consultation_number' => $consultation->consultation_number,
            'chief_complaint' => $consultation->chief_complaint,
            'history_of_present_illness' => $consultation->history_of_present_illness,
            'diagnosis' => $consultation->diagnosis,
            'treatment_plan' => $consultation->treatment_plan,
            'doctor_notes' => $consultation->doctor_notes,
            'follow_up_date' => $consultation->follow_up_date?->toDateString(),
            'status' => $consultation->status,
            'started_at' => $consultation->started_at?->toIso8601String(),
            'completed_at' => $consultation->completed_at?->toIso8601String(),
            'doctor' => [
                'full_name' => $consultation->doctor->full_name,
                'specialization' => $consultation->doctor->specialization,
                'license_number' => $consultation->doctor->license_number,
            ],
            'appointment' => [
                'appointment_number' => $consultation->appointment->appointment_number,
                'appointment_date' => $consultation->appointment->appointment_date?->toDateString(),
                'appointment_time' => $consultation->appointment->appointment_time?->format('H:i'),
                'reason_for_visit' => $consultation->appointment->reason_for_visit,
            ],
        ])->values();

        return [
            'patient' => [
                'id' => $patient->id,
                'patient_code' => $patient->patient_code,
                'full_name' => $patient->full_name,
                'gender' => $patient->gender,
                'birthdate' => $patient->birthdate?->toDateString(),
                'age' => $patient->age,
                'civil_status' => $patient->civil_status,
                'contact_number' => $patient->contact_number,
                'email' => $patient->email,
                'address' => $patient->address,
                'emergency_contact_name' => $patient->emergency_contact_name,
                'emergency_contact_number' => $patient->emergency_contact_number,
                'blood_type' => $patient->blood_type,
                'allergies' => $patient->allergies,
                'existing_conditions' => $patient->existing_conditions,
            ],
            'consultations' => $consultations,
            'diagnoses' => $patient->consultations
                ->filter(fn (Consultation $consultation): bool => filled($consultation->diagnosis))
                ->map(fn (Consultation $consultation): array => [
                    'consultation_number' => $consultation->consultation_number,
                    'diagnosis' => $consultation->diagnosis,
                    'diagnosed_at' => ($consultation->completed_at ?? $consultation->started_at)?->toIso8601String(),
                    'doctor_name' => $consultation->doctor->full_name,
                ])->values(),
            'prescriptions' => $patient->consultations
                ->flatMap(fn (Consultation $consultation) => $consultation->prescriptions->map(
                    fn (Prescription $prescription): array => [
                        'id' => $prescription->id,
                        'prescription_number' => $prescription->prescription_number,
                        'status' => $prescription->status,
                        'consultation_number' => $consultation->consultation_number,
                        'medications' => $prescription->items->isNotEmpty()
                            ? $prescription->items->map(fn ($item): string => "{$item->medicine_name} — {$item->dosage}, {$item->frequency}, {$item->duration} (Qty: {$item->quantity})")->implode("\n")
                            : $prescription->medications,
                        'instructions' => $prescription->notes ?? $prescription->instructions,
                        'prescribed_at' => $prescription->created_at?->toIso8601String(),
                        'doctor_name' => $consultation->doctor->full_name,
                    ]
                ))->values(),
            'laboratory_requests' => $patient->consultations
                ->flatMap(fn (Consultation $consultation) => $consultation->laboratoryRequests->map(
                    fn (LaboratoryRequest $laboratoryRequest): array => [
                        'id' => $laboratoryRequest->id,
                        'lab_request_number' => $laboratoryRequest->lab_request_number,
                        'consultation_number' => $consultation->consultation_number,
                        'tests' => $laboratoryRequest->requested_tests !== null
                            ? collect($laboratoryRequest->requested_tests)->implode(', ')
                            : $laboratoryRequest->tests,
                        'instructions' => $laboratoryRequest->clinical_notes ?? $laboratoryRequest->instructions,
                        'status' => $laboratoryRequest->status,
                        'result' => $laboratoryRequest->labResult?->result_details ?? $laboratoryRequest->result,
                        'result_notes' => $laboratoryRequest->labResult?->remarks ?? $laboratoryRequest->result_notes,
                        'has_attachment' => filled($laboratoryRequest->labResult?->attachment_path),
                        'requested_at' => ($laboratoryRequest->requested_at ?? $laboratoryRequest->created_at)?->toIso8601String(),
                        'resulted_at' => ($laboratoryRequest->labResult?->uploaded_at ?? $laboratoryRequest->resulted_at)?->toIso8601String(),
                        'doctor_name' => $consultation->doctor->full_name,
                    ]
                ))->values(),
            'vital_signs' => $patient->vitalSigns->map(fn (VitalSign $vitalSign): array => [
                'id' => $vitalSign->id,
                'temperature' => $vitalSign->temperature,
                'blood_pressure' => $vitalSign->blood_pressure,
                'pulse_rate' => $vitalSign->pulse_rate,
                'respiratory_rate' => $vitalSign->respiratory_rate,
                'oxygen_saturation' => $vitalSign->oxygen_saturation,
                'height' => $vitalSign->height,
                'weight' => $vitalSign->weight,
                'bmi' => $vitalSign->bmi,
                'notes' => $vitalSign->notes,
                'recorded_at' => $vitalSign->recorded_at?->toIso8601String(),
                'recorded_by' => $vitalSign->recorder?->name,
                'appointment_number' => $vitalSign->appointment?->appointment_number,
            ])->values(),
            'follow_ups' => $patient->consultations
                ->filter(fn (Consultation $consultation): bool => $consultation->follow_up_date !== null)
                ->map(fn (Consultation $consultation): array => [
                    'consultation_number' => $consultation->consultation_number,
                    'follow_up_date' => $consultation->follow_up_date?->toDateString(),
                    'treatment_plan' => $consultation->treatment_plan,
                    'doctor_name' => $consultation->doctor->full_name,
                ])->values(),
        ];
    }

    private function scopeForActor(Builder $query, User $actor): void
    {
        if ($actor->can('medical-records.view')) {
            return;
        }

        if ($actor->can('medical-records.assigned.view')) {
            $doctorId = $actor->doctor()->value('id');

            $query->whereHas('appointments', fn ($query) => $query->where('doctor_id', $doctorId ?? 0));

            return;
        }

        if ((bool) config('clinic.patient_portal_enabled') && $actor->can('medical-records.own.view')) {
            $query->where('user_id', $actor->id);

            return;
        }

        $query->whereKey(0);
    }
}
