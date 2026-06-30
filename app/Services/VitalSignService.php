<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VitalSignService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $actor): VitalSign
    {
        return DB::transaction(function () use ($data, $actor): VitalSign {
            $appointment = Appointment::query()->whereKey($data['appointment_id'])->firstOrFail();

            if ((int) $appointment->patient_id !== (int) $data['patient_id']) {
                throw ValidationException::withMessages([
                    'patient_id' => 'The selected patient does not match this appointment.',
                ]);
            }

            $vitalSign = VitalSign::create([
                ...$data,
                'recorded_by' => $actor->id,
                'bmi' => $this->calculateBmi($data['height'] ?? null, $data['weight'] ?? null),
                'recorded_at' => $data['recorded_at'] ?? now(),
            ]);

            activity('vital-signs')
                ->causedBy($actor)
                ->performedOn($vitalSign)
                ->event('created')
                ->log('Recorded vital signs');

            return $vitalSign;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function recordContext(Appointment $appointment): array
    {
        $appointment->loadMissing(['patient', 'doctor']);

        return [
            'appointment' => [
                'id' => $appointment->id,
                'appointment_number' => $appointment->appointment_number,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
                'appointment_date' => $appointment->appointment_date?->toDateString(),
                'appointment_time' => $appointment->appointment_time?->format('H:i'),
                'patient' => [
                    'id' => $appointment->patient->id,
                    'full_name' => $appointment->patient->full_name,
                    'patient_code' => $appointment->patient->patient_code,
                ],
                'doctor' => [
                    'id' => $appointment->doctor->id,
                    'full_name' => $appointment->doctor->full_name,
                    'specialization' => $appointment->doctor->specialization,
                ],
            ],
            'latest_vital_signs' => $this->latestForAppointment($appointment),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function appointmentView(Appointment $appointment): array
    {
        return [
            ...$this->recordContext($appointment),
            'vital_signs' => $this->forAppointment($appointment),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function patientHistory(Patient $patient): array
    {
        return [
            'patient' => [
                'id' => $patient->id,
                'patient_code' => $patient->patient_code,
                'full_name' => $patient->full_name,
            ],
            'vital_signs' => $this->forPatient($patient),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function forAppointment(Appointment $appointment): Collection
    {
        return VitalSign::query()
            ->with(['recorder:id,name,email,username'])
            ->where('appointment_id', $appointment->id)
            ->orderByDesc('recorded_at')
            ->get()
            ->map(fn (VitalSign $vitalSign): array => $this->summary($vitalSign));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function forPatient(Patient $patient): Collection
    {
        return VitalSign::query()
            ->with(['appointment:id,appointment_number,appointment_date,appointment_time', 'recorder:id,name,email,username'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('recorded_at')
            ->get()
            ->map(fn (VitalSign $vitalSign): array => $this->summary($vitalSign));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function latestForAppointment(Appointment $appointment): ?array
    {
        $vitalSign = VitalSign::query()
            ->with(['recorder:id,name,email,username'])
            ->where('appointment_id', $appointment->id)
            ->latest('recorded_at')
            ->first();

        return $vitalSign ? $this->summary($vitalSign) : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(VitalSign $vitalSign): array
    {
        $vitalSign->loadMissing(['appointment:id,appointment_number,appointment_date,appointment_time', 'recorder:id,name,email,username']);

        return [
            'id' => $vitalSign->id,
            'patient_id' => $vitalSign->patient_id,
            'appointment_id' => $vitalSign->appointment_id,
            'recorded_by' => $vitalSign->recorded_by,
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
            'created_at' => $vitalSign->created_at?->toIso8601String(),
            'updated_at' => $vitalSign->updated_at?->toIso8601String(),
            'appointment' => $vitalSign->appointment ? [
                'id' => $vitalSign->appointment->id,
                'appointment_number' => $vitalSign->appointment->appointment_number,
                'appointment_date' => $vitalSign->appointment->appointment_date?->toDateString(),
                'appointment_time' => $vitalSign->appointment->appointment_time?->format('H:i'),
            ] : null,
            'recorder' => $vitalSign->recorder ? [
                'id' => $vitalSign->recorder->id,
                'name' => $vitalSign->recorder->name,
                'email' => $vitalSign->recorder->email,
                'username' => $vitalSign->recorder->username,
            ] : null,
        ];
    }

    private function calculateBmi(mixed $height, mixed $weight): ?float
    {
        if (blank($height) || blank($weight) || (float) $height <= 0) {
            return null;
        }

        $heightInMeters = (float) $height / 100;

        return round((float) $weight / ($heightInMeters ** 2), 2);
    }
}
