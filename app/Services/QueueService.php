<?php

namespace App\Services;

use App\Events\QueueUpdated;
use App\Models\Appointment;
use App\Models\ClinicQueue;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QueueService
{
    /**
     * @param  array{search?: string|null, status?: string|null, doctor_id?: int|string|null, queue_date?: string|null}  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->baseQuery($filters)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (ClinicQueue $queue): array => $this->summary($queue));
    }

    /**
     * @param  array{search?: string|null, status?: string|null, doctor_id?: int|string|null, queue_date?: string|null}  $filters
     * @return Collection<int, array<string, mixed>>
     */
    public function activeList(array $filters = []): Collection
    {
        return $this->baseQuery($filters)
            ->whereIn('status', ClinicQueue::ACTIVE_STATUSES)
            ->get()
            ->map(fn (ClinicQueue $queue): array => $this->summary($queue));
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
    public function checkIn(array $data, User $actor): ClinicQueue
    {
        return DB::transaction(function () use ($data, $actor): ClinicQueue {
            $appointment = $this->appointmentFromCheckIn($data);
            $queueDate = Carbon::parse($appointment?->appointment_date ?? ($data['queue_date'] ?? now()))->toDateString();
            $doctorId = $appointment?->doctor_id ?? $data['doctor_id'];
            $patientId = $appointment?->patient_id ?? $data['patient_id'];
            $doctor = Doctor::query()->whereKey($doctorId)->firstOrFail();

            if ($doctor->status !== 'active') {
                throw ValidationException::withMessages([
                    'doctor_id' => 'Inactive doctors cannot receive queue check-ins.',
                ]);
            }

            $existingQueue = ClinicQueue::query()
                ->whereDate('queue_date', $queueDate)
                ->where('patient_id', $patientId)
                ->whereIn('status', ClinicQueue::ACTIVE_STATUSES)
                ->first();

            if ($existingQueue !== null) {
                throw ValidationException::withMessages([
                    'patient_id' => 'This patient is already in the active queue today.',
                ]);
            }

            $queue = ClinicQueue::create([
                'queue_number' => $this->nextQueueNumber($queueDate),
                'appointment_id' => $appointment?->id,
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'queue_date' => $queueDate,
                'status' => ClinicQueue::STATUS_WAITING,
                'checked_in_at' => now(),
            ]);

            if ($appointment !== null) {
                $appointment->forceFill(['status' => Appointment::STATUS_CHECKED_IN])->save();
            }

            activity('queue-management')
                ->causedBy($actor)
                ->performedOn($queue)
                ->event('created')
                ->log('Checked in patient');

            QueueUpdated::dispatch($queue->fresh(['patient', 'doctor']));

            return $queue;
        });
    }

    public function callNext(User $actor, ?Doctor $doctor = null): ClinicQueue
    {
        return DB::transaction(function () use ($actor, $doctor): ClinicQueue {
            $query = ClinicQueue::query()
                ->whereDate('queue_date', now()->toDateString())
                ->whereIn('status', [ClinicQueue::STATUS_WAITING, ClinicQueue::STATUS_SKIPPED])
                ->orderByRaw('case when status = ? then 0 else 1 end', [ClinicQueue::STATUS_WAITING])
                ->orderBy('checked_in_at')
                ->lockForUpdate();

            if ($doctor !== null) {
                $query->where('doctor_id', $doctor->id);
            }

            $queue = $query->first();

            if ($queue === null) {
                throw ValidationException::withMessages([
                    'queue' => 'There are no waiting patients to call.',
                ]);
            }

            return $this->markCalled($queue, $actor);
        });
    }

    public function recall(ClinicQueue $queue, User $actor): ClinicQueue
    {
        if (! in_array($queue->status, [ClinicQueue::STATUS_WAITING, ClinicQueue::STATUS_SKIPPED], true)) {
            throw ValidationException::withMessages([
                'queue' => 'Only waiting or skipped patients can be called.',
            ]);
        }

        return $this->markCalled($queue, $actor);
    }

    public function startConsultation(ClinicQueue $queue, User $actor): ClinicQueue
    {
        return $this->transition($queue, ClinicQueue::STATUS_IN_CONSULTATION, $actor, [
            'called_at' => $queue->called_at ?? now(),
        ], 'Started consultation');
    }

    public function skip(ClinicQueue $queue, User $actor): ClinicQueue
    {
        return $this->transition($queue, ClinicQueue::STATUS_SKIPPED, $actor, [], 'Skipped patient');
    }

    public function complete(ClinicQueue $queue, User $actor): ClinicQueue
    {
        return $this->transition($queue, ClinicQueue::STATUS_COMPLETED, $actor, [
            'completed_at' => now(),
        ], 'Completed queue consultation');
    }

    public function cancel(ClinicQueue $queue, User $actor): ClinicQueue
    {
        return $this->transition($queue, ClinicQueue::STATUS_CANCELLED, $actor, [], 'Cancelled queue item');
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(ClinicQueue $queue): array
    {
        $queue->loadMissing(['appointment', 'patient', 'doctor']);

        return [
            'id' => $queue->id,
            'queue_number' => $queue->queue_number,
            'appointment_id' => $queue->appointment_id,
            'appointment_number' => $queue->appointment?->appointment_number,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $queue->doctor_id,
            'queue_date' => $queue->queue_date?->toDateString(),
            'status' => $queue->status,
            'checked_in_at' => $queue->checked_in_at?->toIso8601String(),
            'called_at' => $queue->called_at?->toIso8601String(),
            'completed_at' => $queue->completed_at?->toIso8601String(),
            'patient' => [
                'id' => $queue->patient->id,
                'full_name' => $queue->patient->full_name,
                'patient_code' => $queue->patient->patient_code,
            ],
            'doctor' => [
                'id' => $queue->doctor->id,
                'full_name' => $queue->doctor->full_name,
                'specialization' => $queue->doctor->specialization,
            ],
            'created_at' => $queue->created_at?->toIso8601String(),
            'updated_at' => $queue->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @param  array{search?: string|null, status?: string|null, doctor_id?: int|string|null, queue_date?: string|null}  $filters
     * @return Builder<ClinicQueue>
     */
    private function baseQuery(array $filters = []): Builder
    {
        $query = ClinicQueue::query()
            ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name,specialization'])
            ->whereDate('queue_date', $filters['queue_date'] ?? now()->toDateString())
            ->orderByRaw("case status when 'Called' then 0 when 'In Consultation' then 1 when 'Waiting' then 2 when 'Skipped' then 3 else 4 end")
            ->orderBy('checked_in_at');

        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search): void {
                $query->where('queue_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($query) use ($search): void {
                        $query->where('patient_code', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('doctor', function ($query) use ($search): void {
                        $query->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('specialization', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['doctor_id'])) {
            $query->where('doctor_id', $filters['doctor_id']);
        }

        return $query;
    }

    private function nextQueueNumber(string $queueDate): string
    {
        $count = ClinicQueue::query()
            ->whereDate('queue_date', $queueDate)
            ->lockForUpdate()
            ->count();

        return 'Q-'.str_pad((string) ($count + 1), 3, '0', STR_PAD_LEFT);
    }

    private function markCalled(ClinicQueue $queue, User $actor): ClinicQueue
    {
        return $this->transition($queue, ClinicQueue::STATUS_CALLED, $actor, [
            'called_at' => now(),
        ], 'Called queue patient');
    }

    /**
     * @return Collection<int, array{id: int, appointment_number: string, patient_id: int, doctor_id: int, appointment_date: string, appointment_time: string, patient_name: string, doctor_name: string}>
     */
    public function checkInAppointments(): Collection
    {
        return Appointment::query()
            ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name,specialization'])
            ->whereDate('appointment_date', now()->toDateString())
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
            ->whereDoesntHave('queue', function (Builder $query): void {
                $query->whereIn('status', ClinicQueue::ACTIVE_STATUSES);
            })
            ->orderBy('appointment_time')
            ->get()
            ->map(fn (Appointment $appointment): array => [
                'id' => $appointment->id,
                'appointment_number' => $appointment->appointment_number,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
                'appointment_date' => $appointment->appointment_date?->toDateString(),
                'appointment_time' => Carbon::parse($appointment->appointment_time)->format('H:i'),
                'patient_name' => $appointment->patient->full_name,
                'doctor_name' => $appointment->doctor->full_name,
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function appointmentFromCheckIn(array $data): ?Appointment
    {
        if (empty($data['appointment_id'])) {
            return null;
        }

        $appointment = Appointment::query()
            ->lockForUpdate()
            ->findOrFail($data['appointment_id']);

        if (! in_array($appointment->status, [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED], true)) {
            throw ValidationException::withMessages([
                'appointment_id' => 'Only pending or confirmed appointments can be checked in.',
            ]);
        }

        return $appointment;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function transition(ClinicQueue $queue, string $status, User $actor, array $attributes, string $log): ClinicQueue
    {
        $queue->forceFill([
            ...$attributes,
            'status' => $status,
        ])->save();

        activity('queue-management')
            ->causedBy($actor)
            ->performedOn($queue)
            ->withProperties(['status' => $status])
            ->event('updated')
            ->log($log);

        $this->syncAppointmentStatus($queue, $status);

        QueueUpdated::dispatch($queue->fresh(['patient', 'doctor']));

        return $queue;
    }

    private function syncAppointmentStatus(ClinicQueue $queue, string $queueStatus): void
    {
        if ($queue->appointment_id === null) {
            return;
        }

        $appointmentStatus = match ($queueStatus) {
            ClinicQueue::STATUS_IN_CONSULTATION => Appointment::STATUS_IN_CONSULTATION,
            ClinicQueue::STATUS_COMPLETED => Appointment::STATUS_COMPLETED,
            ClinicQueue::STATUS_CANCELLED => Appointment::STATUS_CANCELLED,
            default => null,
        };

        if ($appointmentStatus === null) {
            return;
        }

        $queue->appointment?->forceFill(['status' => $appointmentStatus])->save();
    }
}
