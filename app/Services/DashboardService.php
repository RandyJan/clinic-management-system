<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Billing;
use App\Models\ClinicQueue;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\LaboratoryRequest;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\StockTransaction;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class DashboardService
{
    /**
     * @return array{
     *     role: string,
     *     title: string,
     *     description: string,
     *     stats: list<array{label: string, value: int|float, format: string, hint: string|null}>,
     *     chart: array{title: string, description: string, data: list<array{label: string, value: int|float}>}|null,
     *     tables: list<array{title: string, description: string, columns: list<string>, rows: list<array<string, string|int|float|null>>}>
     * }
     */
    public function forUser(User $user): array
    {
        return match ($this->primaryRole($user)) {
            'Administrator' => $this->adminDashboard(),
            'Receptionist' => $this->receptionistDashboard(),
            'Doctor' => $this->doctorDashboard($user),
            'Nurse' => $this->nurseDashboard(),
            'Cashier' => $this->cashierDashboard(),
            'Pharmacist' => $this->pharmacistDashboard(),
            'Patient' => $this->patientDashboard($user),
            default => $this->guestDashboard(),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function adminDashboard(): array
    {
        return [
            'role' => 'Administrator',
            'title' => 'Clinic operations',
            'description' => 'Clinic-wide activity for today.',
            'stats' => [
                $this->stat('Total patients', Patient::query()->count(), 'number'),
                $this->stat('Total doctors', Doctor::query()->count(), 'number'),
                $this->stat('Appointments today', $this->appointmentsToday()->count(), 'number'),
                $this->stat('Revenue today', $this->collectionsToday(), 'currency'),
                $this->stat('Pending lab results', $this->pendingLaboratoryResults()->count(), 'number'),
                $this->stat('Low stock medicines', $this->lowStockMedicines()->count(), 'number'),
            ],
            'chart' => $this->appointmentTrendChart(),
            'tables' => [
                $this->table('Recent activities', 'Latest audited system actions.', ['Event', 'Description', 'When'], $this->recentActivities()),
                $this->table('Low stock medicines', 'Medicines at or below reorder level.', ['Medicine', 'Stock', 'Reorder level'], $this->lowStockMedicineRows()),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function receptionistDashboard(): array
    {
        return [
            'role' => 'Receptionist',
            'title' => 'Front desk',
            'description' => 'Appointment flow and checked-in patients.',
            'stats' => [
                $this->stat('Appointments today', $this->appointmentsToday()->count(), 'number'),
                $this->stat('Pending appointments', Appointment::query()->where('status', Appointment::STATUS_PENDING)->count(), 'number'),
                $this->stat('Checked-in patients', $this->appointmentsToday()->where('status', Appointment::STATUS_CHECKED_IN)->count(), 'number'),
                $this->stat('Cancelled appointments', $this->appointmentsToday()->where('status', Appointment::STATUS_CANCELLED)->count(), 'number'),
            ],
            'chart' => $this->appointmentStatusChart($this->appointmentsToday()),
            'tables' => [
                $this->table('Today appointments', 'Scheduled patients for the current clinic day.', ['Time', 'Patient', 'Doctor', 'Status'], $this->appointmentRows($this->appointmentsToday()->with(['patient:id,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name']))),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function doctorDashboard(User $user): array
    {
        $doctorId = $user->doctor()->value('id');

        if ($doctorId === null) {
            return $this->guestDashboard('Doctor profile is not linked yet.');
        }

        $doctorAppointmentsToday = $this->appointmentsToday()->where('doctor_id', $doctorId);

        return [
            'role' => 'Doctor',
            'title' => 'My clinic day',
            'description' => 'Assigned appointments, waiting patients, and recent consultations.',
            'stats' => [
                $this->stat('My appointments today', $doctorAppointmentsToday->count(), 'number'),
                $this->stat('Waiting patients', $this->waitingQueue()->where('doctor_id', $doctorId)->count(), 'number'),
                $this->stat('Completed consultations', Consultation::query()->where('doctor_id', $doctorId)->whereDate('completed_at', today())->count(), 'number'),
            ],
            'chart' => $this->appointmentStatusChart($doctorAppointmentsToday),
            'tables' => [
                $this->table('Waiting patients', 'Patients checked in for your queue.', ['Queue', 'Patient', 'Status'], $this->queueRows($this->waitingQueue()->where('doctor_id', $doctorId)->with('patient:id,first_name,middle_name,last_name,suffix'))),
                $this->table('Recent patient records', 'Latest completed consultations you handled.', ['Patient', 'Diagnosis', 'Completed'], $this->recentConsultationRows(Consultation::query()->where('doctor_id', $doctorId))),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function nurseDashboard(): array
    {
        $waitingForVitals = $this->appointmentsToday()
            ->whereIn('status', [Appointment::STATUS_CHECKED_IN, Appointment::STATUS_CONFIRMED])
            ->whereDoesntHave('vitalSigns');

        return [
            'role' => 'Nurse',
            'title' => 'Vital signs',
            'description' => 'Patients waiting for intake and completed vital signs today.',
            'stats' => [
                $this->stat('Waiting for vital signs', $waitingForVitals->count(), 'number'),
                $this->stat('Completed vital signs today', VitalSign::query()->whereDate('recorded_at', today())->count(), 'number'),
            ],
            'chart' => null,
            'tables' => [
                $this->table('Waiting for vital signs', 'Checked-in patients without a vital sign record.', ['Time', 'Patient', 'Status'], $this->vitalSignWaitingRows($waitingForVitals->with('patient:id,first_name,middle_name,last_name,suffix'))),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function cashierDashboard(): array
    {
        return [
            'role' => 'Cashier',
            'title' => 'Billing desk',
            'description' => 'Unpaid bills and today’s collections.',
            'stats' => [
                $this->stat('Unpaid bills', Billing::query()->whereIn('payment_status', [Billing::STATUS_UNPAID, Billing::STATUS_PARTIALLY_PAID])->count(), 'number'),
                $this->stat('Paid bills today', Billing::query()->where('payment_status', Billing::STATUS_PAID)->whereDate('updated_at', today())->count(), 'number'),
                $this->stat('Collections today', $this->collectionsToday(), 'currency'),
            ],
            'chart' => $this->collectionsTrendChart(),
            'tables' => [
                $this->table('Unpaid bills', 'Bills requiring payment follow-up.', ['Invoice', 'Patient', 'Balance'], $this->unpaidBillingRows()),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function pharmacistDashboard(): array
    {
        return [
            'role' => 'Pharmacist',
            'title' => 'Pharmacy',
            'description' => 'Prescription queue and medicine inventory alerts.',
            'stats' => [
                $this->stat('Pending prescriptions', Prescription::query()->where('status', Prescription::STATUS_PENDING)->count(), 'number'),
                $this->stat('Low stock medicines', $this->lowStockMedicines()->count(), 'number'),
                $this->stat('Dispensed medicines today', StockTransaction::query()->where('transaction_type', StockTransaction::TYPE_DISPENSED)->whereDate('created_at', today())->sum('quantity'), 'number'),
            ],
            'chart' => null,
            'tables' => [
                $this->table('Pending prescriptions', 'Prescriptions awaiting dispense.', ['Prescription', 'Patient', 'Doctor'], $this->pendingPrescriptionRows()),
                $this->table('Low stock medicines', 'Medicines at or below reorder level.', ['Medicine', 'Stock', 'Reorder level'], $this->lowStockMedicineRows()),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function patientDashboard(User $user): array
    {
        $patientId = $user->patient()->value('id');

        if ($patientId === null) {
            return $this->guestDashboard('Patient profile is not linked yet.');
        }

        return [
            'role' => 'Patient',
            'title' => 'My health record',
            'description' => 'Upcoming appointments, clinical notes, prescriptions, and bills.',
            'stats' => [
                $this->stat('Upcoming appointments', Appointment::query()->where('patient_id', $patientId)->whereDate('appointment_date', '>=', today())->whereIn('status', Appointment::BOOKED_STATUSES)->count(), 'number'),
                $this->stat('Recent consultations', Consultation::query()->where('patient_id', $patientId)->where('status', Consultation::STATUS_COMPLETED)->count(), 'number'),
                $this->stat('Recent prescriptions', Prescription::query()->where('patient_id', $patientId)->count(), 'number'),
                $this->stat('Open bill balance', $this->patientBalance($patientId), 'currency'),
            ],
            'chart' => null,
            'tables' => [
                $this->table('Upcoming appointments', 'Your next scheduled clinic visits.', ['Date', 'Time', 'Doctor', 'Status'], $this->patientAppointmentRows($patientId)),
                $this->table('Recent consultations', 'Latest completed consultations.', ['Doctor', 'Diagnosis', 'Completed'], $this->recentConsultationRows(Consultation::query()->where('patient_id', $patientId))),
                $this->table('Recent prescriptions', 'Latest prescriptions on record.', ['Prescription', 'Doctor', 'Status'], $this->patientPrescriptionRows($patientId)),
                $this->table('Billing status', 'Recent bills and payment status.', ['Invoice', 'Status', 'Balance'], $this->patientBillingRows($patientId)),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function guestDashboard(string $description = 'No role-specific dashboard is configured for this account.'): array
    {
        return [
            'role' => 'General',
            'title' => 'Dashboard',
            'description' => $description,
            'stats' => [$this->stat('Available modules', 0, 'number', 'Ask an administrator to assign the right role.')],
            'chart' => null,
            'tables' => [],
        ];
    }

    private function primaryRole(User $user): string
    {
        foreach (['Administrator', 'Receptionist', 'Doctor', 'Nurse', 'Cashier', 'Pharmacist', 'Patient'] as $role) {
            if ($user->hasRole($role)) {
                return $role;
            }
        }

        return (string) ($user->getRoleNames()->first() ?? 'General');
    }

    /**
     * @return Builder<Appointment>
     */
    private function appointmentsToday(): Builder
    {
        return Appointment::query()->whereDate('appointment_date', today());
    }

    /**
     * @return Builder<LaboratoryRequest>
     */
    private function pendingLaboratoryResults(): Builder
    {
        return LaboratoryRequest::query()->whereIn('status', [LaboratoryRequest::STATUS_PENDING, LaboratoryRequest::STATUS_IN_PROGRESS]);
    }

    /**
     * @return Builder<Medicine>
     */
    private function lowStockMedicines(): Builder
    {
        return Medicine::query()
            ->where('status', Medicine::STATUS_ACTIVE)
            ->whereColumn('current_stock', '<=', 'reorder_level');
    }

    /**
     * @return Builder<ClinicQueue>
     */
    private function waitingQueue(): Builder
    {
        return ClinicQueue::query()
            ->whereDate('queue_date', today())
            ->whereIn('status', [ClinicQueue::STATUS_WAITING, ClinicQueue::STATUS_CALLED]);
    }

    private function collectionsToday(): float
    {
        return (float) Payment::query()
            ->whereDate('payment_date', today())
            ->sum('amount_paid');
    }

    private function patientBalance(int $patientId): float
    {
        return Billing::query()
            ->withSum('payments as paid_total', 'amount_paid')
            ->where('patient_id', $patientId)
            ->whereIn('payment_status', [Billing::STATUS_UNPAID, Billing::STATUS_PARTIALLY_PAID])
            ->get()
            ->sum(fn (Billing $billing): float => max(0, (float) $billing->grand_total - (float) $billing->paid_total));
    }

    /**
     * @return array{label: string, value: int|float, format: string, hint: string|null}
     */
    private function stat(string $label, int|float $value, string $format, ?string $hint = null): array
    {
        return compact('label', 'value', 'format', 'hint');
    }

    /**
     * @param  list<string>  $columns
     * @param  list<array<string, string|int|float|null>>  $rows
     * @return array{title: string, description: string, columns: list<string>, rows: list<array<string, string|int|float|null>>}
     */
    private function table(string $title, string $description, array $columns, array $rows): array
    {
        return compact('title', 'description', 'columns', 'rows');
    }

    /**
     * @return array{title: string, description: string, data: list<array{label: string, value: int|float}>}
     */
    private function appointmentTrendChart(): array
    {
        return [
            'title' => 'Appointments this week',
            'description' => 'Daily appointment volume for the last seven days.',
            'data' => $this->dailyCounts(Appointment::query(), 'appointment_date'),
        ];
    }

    /**
     * @param  Builder<Appointment>  $query
     * @return array{title: string, description: string, data: list<array{label: string, value: int|float}>}
     */
    private function appointmentStatusChart(Builder $query): array
    {
        $counts = (clone $query)
            ->select('status', DB::raw('count(*) as aggregate'))
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return [
            'title' => 'Appointment status',
            'description' => 'Current status split for today.',
            'data' => collect(Appointment::STATUSES)
                ->map(fn (string $status): array => [
                    'label' => $status,
                    'value' => (int) ($counts[$status] ?? 0),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array{title: string, description: string, data: list<array{label: string, value: int|float}>}
     */
    private function collectionsTrendChart(): array
    {
        return [
            'title' => 'Collections this week',
            'description' => 'Daily paid amount for the last seven days.',
            'data' => $this->dailySums(Payment::query(), 'payment_date', 'amount_paid'),
        ];
    }

    /**
     * @param  Builder<Appointment>  $query
     * @return list<array<string, string|null>>
     */
    private function appointmentRows(Builder $query): array
    {
        return $query
            ->orderBy('appointment_time')
            ->limit(8)
            ->get()
            ->map(fn (Appointment $appointment): array => [
                'Time' => $appointment->appointment_time?->format('H:i'),
                'Patient' => $appointment->patient?->full_name,
                'Doctor' => $appointment->doctor?->full_name,
                'Status' => $appointment->status,
            ])
            ->all();
    }

    /**
     * @param  Builder<Appointment>  $query
     * @return list<array<string, string|null>>
     */
    private function vitalSignWaitingRows(Builder $query): array
    {
        return $query
            ->orderBy('appointment_time')
            ->limit(8)
            ->get()
            ->map(fn (Appointment $appointment): array => [
                'Time' => $appointment->appointment_time?->format('H:i'),
                'Patient' => $appointment->patient?->full_name,
                'Status' => $appointment->status,
            ])
            ->all();
    }

    /**
     * @param  Builder<ClinicQueue>  $query
     * @return list<array<string, string|null>>
     */
    private function queueRows(Builder $query): array
    {
        return $query
            ->orderBy('checked_in_at')
            ->limit(8)
            ->get()
            ->map(fn (ClinicQueue $queue): array => [
                'Queue' => $queue->queue_number,
                'Patient' => $queue->patient?->full_name,
                'Status' => $queue->status,
            ])
            ->all();
    }

    /**
     * @param  Builder<Consultation>  $query
     * @return list<array<string, string|null>>
     */
    private function recentConsultationRows(Builder $query): array
    {
        return $query
            ->with(['patient:id,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name'])
            ->where('status', Consultation::STATUS_COMPLETED)
            ->latest('completed_at')
            ->limit(6)
            ->get()
            ->map(fn (Consultation $consultation): array => [
                'Patient' => $consultation->patient?->full_name,
                'Doctor' => $consultation->doctor?->full_name,
                'Diagnosis' => $consultation->diagnosis,
                'Completed' => $consultation->completed_at?->diffForHumans(),
            ])
            ->map(fn (array $row): array => array_filter($row, fn (string $key): bool => in_array($key, ['Patient', 'Diagnosis', 'Completed', 'Doctor'], true), ARRAY_FILTER_USE_KEY))
            ->all();
    }

    /**
     * @return list<array<string, string|int>>
     */
    private function lowStockMedicineRows(): array
    {
        return $this->lowStockMedicines()
            ->orderBy('current_stock')
            ->limit(8)
            ->get(['id', 'name', 'current_stock', 'reorder_level'])
            ->map(fn (Medicine $medicine): array => [
                'Medicine' => $medicine->name,
                'Stock' => $medicine->current_stock,
                'Reorder level' => $medicine->reorder_level,
            ])
            ->all();
    }

    /**
     * @return list<array<string, string|null>>
     */
    private function pendingPrescriptionRows(): array
    {
        return Prescription::query()
            ->with(['patient:id,first_name,middle_name,last_name,suffix', 'doctor:id,first_name,last_name'])
            ->where('status', Prescription::STATUS_PENDING)
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Prescription $prescription): array => [
                'Prescription' => $prescription->prescription_number,
                'Patient' => $prescription->patient?->full_name,
                'Doctor' => $prescription->doctor?->full_name,
            ])
            ->all();
    }

    /**
     * @return list<array<string, string|float|null>>
     */
    private function unpaidBillingRows(): array
    {
        return Billing::query()
            ->with('patient:id,first_name,middle_name,last_name,suffix')
            ->withSum('payments as paid_total', 'amount_paid')
            ->whereIn('payment_status', [Billing::STATUS_UNPAID, Billing::STATUS_PARTIALLY_PAID])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Billing $billing): array => [
                'Invoice' => $billing->invoice_number,
                'Patient' => $billing->patient?->full_name,
                'Balance' => max(0, (float) $billing->grand_total - (float) $billing->paid_total),
            ])
            ->all();
    }

    /**
     * @return list<array<string, string|null>>
     */
    private function patientAppointmentRows(int $patientId): array
    {
        return Appointment::query()
            ->with('doctor:id,first_name,last_name')
            ->where('patient_id', $patientId)
            ->whereDate('appointment_date', '>=', today())
            ->whereIn('status', Appointment::BOOKED_STATUSES)
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(6)
            ->get()
            ->map(fn (Appointment $appointment): array => [
                'Date' => $appointment->appointment_date?->toDateString(),
                'Time' => $appointment->appointment_time?->format('H:i'),
                'Doctor' => $appointment->doctor?->full_name,
                'Status' => $appointment->status,
            ])
            ->all();
    }

    /**
     * @return list<array<string, string|null>>
     */
    private function patientPrescriptionRows(int $patientId): array
    {
        return Prescription::query()
            ->with('doctor:id,first_name,last_name')
            ->where('patient_id', $patientId)
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Prescription $prescription): array => [
                'Prescription' => $prescription->prescription_number,
                'Doctor' => $prescription->doctor?->full_name,
                'Status' => $prescription->status,
            ])
            ->all();
    }

    /**
     * @return list<array<string, string|float>>
     */
    private function patientBillingRows(int $patientId): array
    {
        return Billing::query()
            ->withSum('payments as paid_total', 'amount_paid')
            ->where('patient_id', $patientId)
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Billing $billing): array => [
                'Invoice' => $billing->invoice_number,
                'Status' => $billing->payment_status,
                'Balance' => max(0, (float) $billing->grand_total - (float) $billing->paid_total),
            ])
            ->all();
    }

    /**
     * @return list<array<string, string|null>>
     */
    private function recentActivities(): array
    {
        return Activity::query()
            ->latest()
            ->limit(8)
            ->get(['event', 'description', 'created_at'])
            ->map(fn (Activity $activity): array => [
                'Event' => $activity->event,
                'Description' => $activity->description,
                'When' => $activity->created_at?->diffForHumans(),
            ])
            ->all();
    }

    /**
     * @param  Builder<Model>  $query
     * @return list<array{label: string, value: int}>
     */
    private function dailyCounts(Builder $query, string $dateColumn): array
    {
        $start = today()->subDays(6);
        $rows = (clone $query)
            ->whereDate($dateColumn, '>=', $start)
            ->selectRaw("DATE({$dateColumn}) as dashboard_date, count(*) as aggregate")
            ->groupBy('dashboard_date')
            ->pluck('aggregate', 'dashboard_date');

        return $this->lastSevenDays()
            ->map(fn (Carbon $date): array => [
                'label' => $date->format('M j'),
                'value' => (int) ($rows[$date->toDateString()] ?? 0),
            ])
            ->all();
    }

    /**
     * @param  Builder<Model>  $query
     * @return list<array{label: string, value: float}>
     */
    private function dailySums(Builder $query, string $dateColumn, string $sumColumn): array
    {
        $start = today()->subDays(6);
        $rows = (clone $query)
            ->whereDate($dateColumn, '>=', $start)
            ->selectRaw("DATE({$dateColumn}) as dashboard_date, sum({$sumColumn}) as aggregate")
            ->groupBy('dashboard_date')
            ->pluck('aggregate', 'dashboard_date');

        return $this->lastSevenDays()
            ->map(fn (Carbon $date): array => [
                'label' => $date->format('M j'),
                'value' => (float) ($rows[$date->toDateString()] ?? 0),
            ])
            ->all();
    }

    /**
     * @return Collection<int, Carbon>
     */
    private function lastSevenDays(): Collection
    {
        return collect(range(6, 0))->map(fn (int $daysAgo): Carbon => today()->subDays($daysAgo));
    }
}
