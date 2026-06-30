<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(private readonly VitalSignService $vitalSignService) {}

    /**
     * @param  array{date?: string|null, doctor_id?: int|string|null, patient_id?: int|string|null, status?: string|null}  $filters
     */
    public function list(array $filters = [], int $perPage = 15, ?User $viewer = null): LengthAwarePaginator
    {
        return $this->baseQuery($filters, $viewer)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Appointment $appointment): array => $this->summary($appointment));
    }

    /**
     * @param  array{date?: string|null, doctor_id?: int|string|null, patient_id?: int|string|null, status?: string|null}  $filters
     * @return Collection<int, array<string, mixed>>
     */
    public function calendar(array $filters = [], ?User $viewer = null): Collection
    {
        return $this->baseQuery($filters, $viewer)
            ->get()
            ->map(fn (Appointment $appointment): array => $this->summary($appointment));
    }

    /**
     * @return Collection<int, array{id: int, full_name: string, patient_code: string}>
     */
    public function activePatients(): Collection
    {
        return Patient::query()
            ->where('status', 'active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'patient_code', 'first_name', 'middle_name', 'last_name', 'suffix'])
            ->map(fn (Patient $patient): array => [
                'id' => $patient->id,
                'full_name' => $patient->full_name,
                'patient_code' => $patient->patient_code,
            ]);
    }

    /**
     * @return Collection<int, array{id: int, full_name: string, specialization: string}>
     */
    public function activeDoctors(): Collection
    {
        return Doctor::query()
            ->where('status', 'active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'specialization'])
            ->map(fn (Doctor $doctor): array => [
                'id' => $doctor->id,
                'full_name' => $doctor->full_name,
                'specialization' => $doctor->specialization,
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $actor): Appointment
    {
        return DB::transaction(function () use ($data, $actor): Appointment {
            $this->ensureDoctorCanBeBooked($data);

            $appointment = $this->createWithUniqueNumber([
                ...$data,
                'status' => Appointment::STATUS_PENDING,
                'created_by' => $actor->id,
            ]);

            activity('appointment-management')
                ->causedBy($actor)
                ->performedOn($appointment)
                ->event('created')
                ->log('Created appointment');

            return $appointment;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Appointment $appointment, array $data, User $actor): Appointment
    {
        return DB::transaction(function () use ($appointment, $data, $actor): Appointment {
            $this->ensureDoctorCanBeBooked($data, $appointment);

            $appointment->fill($data);
            $appointment->save();

            activity('appointment-management')
                ->causedBy($actor)
                ->performedOn($appointment)
                ->event('updated')
                ->log('Updated appointment');

            return $appointment;
        });
    }

    public function checkIn(Appointment $appointment, User $actor): Appointment
    {
        return $this->transition($appointment, Appointment::STATUS_CHECKED_IN, $actor, 'Checked in appointment');
    }

    public function startConsultation(Appointment $appointment, User $actor): Appointment
    {
        return $this->transition($appointment, Appointment::STATUS_IN_CONSULTATION, $actor, 'Started appointment consultation');
    }

    public function complete(Appointment $appointment, User $actor): Appointment
    {
        return $this->transition($appointment, Appointment::STATUS_COMPLETED, $actor, 'Completed appointment');
    }

    public function cancel(Appointment $appointment, User $actor, ?string $remarks = null): Appointment
    {
        return $this->transition($appointment, Appointment::STATUS_CANCELLED, $actor, 'Cancelled appointment', $remarks);
    }

    /**
     * @return array<string, mixed>
     */
    public function profile(Appointment $appointment): array
    {
        return [
            'appointment' => $this->detail($appointment),
            'latest_vital_signs' => $this->vitalSignService->latestForAppointment($appointment),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(Appointment $appointment): array
    {
        $appointment->loadMissing(['patient', 'doctor', 'creator:id,name,email,username', 'consultation:id,appointment_id,consultation_number,status']);

        return [
            ...$this->summary($appointment),
            'creator' => $appointment->creator ? [
                'id' => $appointment->creator->id,
                'name' => $appointment->creator->name,
                'email' => $appointment->creator->email,
                'username' => $appointment->creator->username,
            ] : null,
            'consultation' => $appointment->consultation ? [
                'id' => $appointment->consultation->id,
                'consultation_number' => $appointment->consultation->consultation_number,
                'status' => $appointment->consultation->status,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(Appointment $appointment): array
    {
        $appointment->loadMissing(['patient', 'doctor']);

        return [
            'id' => $appointment->id,
            'appointment_number' => $appointment->appointment_number,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'appointment_date' => $appointment->appointment_date?->toDateString(),
            'appointment_time' => Carbon::parse($appointment->appointment_time)->format('H:i'),
            'reason_for_visit' => $appointment->reason_for_visit,
            'appointment_type' => $appointment->appointment_type,
            'status' => $appointment->status,
            'remarks' => $appointment->remarks,
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
            'created_at' => $appointment->created_at?->toIso8601String(),
            'updated_at' => $appointment->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @param  array{date?: string|null, doctor_id?: int|string|null, patient_id?: int|string|null, status?: string|null}  $filters
     * @return Builder<Appointment>
     */
    private function baseQuery(array $filters = [], ?User $viewer = null): Builder
    {
        $query = Appointment::query()
            ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name,specialization'])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time');

        if (! empty($filters['date'])) {
            $query->whereDate('appointment_date', $filters['date']);
        }

        if (! empty($filters['doctor_id'])) {
            $query->where('doctor_id', $filters['doctor_id']);
        }

        if (! empty($filters['patient_id'])) {
            $query->where('patient_id', $filters['patient_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if ($viewer !== null && ! $viewer->can('appointments.view')) {
            $doctor = Doctor::query()->where('user_id', $viewer->id)->first();
            $query->where('doctor_id', $doctor?->id ?? 0);
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function ensureDoctorCanBeBooked(array $data, ?Appointment $currentAppointment = null): void
    {
        $doctor = Doctor::query()->whereKey($data['doctor_id'])->firstOrFail();

        if ($doctor->status !== 'active') {
            throw ValidationException::withMessages([
                'doctor_id' => 'Inactive doctors cannot receive appointments.',
            ]);
        }

        if (isset($data['status']) && ! in_array($data['status'], Appointment::BOOKED_STATUSES, true)) {
            return;
        }

        $query = Appointment::query()
            ->where('doctor_id', $data['doctor_id'])
            ->whereDate('appointment_date', $data['appointment_date'])
            ->whereTime('appointment_time', $data['appointment_time'])
            ->whereIn('status', Appointment::BOOKED_STATUSES)
            ->lockForUpdate();

        if ($currentAppointment !== null) {
            $query->whereKeyNot($currentAppointment->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'appointment_time' => 'The selected doctor already has an appointment at this date and time.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createWithUniqueNumber(array $data): Appointment
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return Appointment::create([
                    ...$data,
                    'appointment_number' => $this->generateAppointmentNumber(),
                ]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return Appointment::create([
            ...$data,
            'appointment_number' => $this->generateAppointmentNumber(),
        ]);
    }

    private function generateAppointmentNumber(): string
    {
        do {
            $number = 'APT-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Appointment::query()->where('appointment_number', $number)->exists());

        return $number;
    }

    private function transition(Appointment $appointment, string $status, User $actor, string $log, ?string $remarks = null): Appointment
    {
        $appointment->forceFill([
            'status' => $status,
            'remarks' => $remarks ?? $appointment->remarks,
        ])->save();

        activity('appointment-management')
            ->causedBy($actor)
            ->performedOn($appointment)
            ->withProperties(['status' => $status])
            ->event('updated')
            ->log($log);

        return $appointment;
    }
}
