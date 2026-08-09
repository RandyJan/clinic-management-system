<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Billing;
use App\Models\LaboratoryRequest;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\User;
use App\Notifications\ClinicEventNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * @return array{notifications: Collection<int, array<string, mixed>>, unread_count: int}
     */
    public function latest(User $user): array
    {
        return [
            'notifications' => $user->notifications()
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($n) => $this->format($n)),
            'unread_count' => $user->unreadNotifications()->count(),
        ];
    }

    /**
     * @param  array{search?: string|null, type?: string|null}  $filters
     */
    public function all(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = $user->notifications()->latest();

        $this->applyFilters($query, $filters);

        return $query
            ->paginate(15)
            ->through(fn ($n) => $this->format($n));
    }

    public function notifyAppointmentCreated(Appointment $appointment): void
    {
        $appointment->loadMissing(['patient', 'doctor.user']);
        $message = "{$appointment->patient->full_name} has an appointment on {$appointment->appointment_date?->toDateString()} at {$appointment->appointment_time}.";

        $this->notifyRole('Receptionist', new ClinicEventNotification(
            'New appointment request',
            $message,
            ClinicEventNotification::TYPE_APPOINTMENT,
            route('appointments.show', $appointment),
            Appointment::class,
            $appointment->id,
        ));

        if ($appointment->doctor->user !== null) {
            $this->notifyUser($appointment->doctor->user, new ClinicEventNotification(
                'Appointment scheduled',
                $message,
                ClinicEventNotification::TYPE_APPOINTMENT,
                route('appointments.show', $appointment),
                Appointment::class,
                $appointment->id,
            ));
        }
    }

    public function notifyPrescriptionCreated(Prescription $prescription): void
    {
        $prescription->loadMissing(['patient', 'doctor']);

        $this->notifyRole('Pharmacist', new ClinicEventNotification(
            'Prescription ready for dispensing',
            "{$prescription->prescription_number} was created for {$prescription->patient->full_name} by Dr. {$prescription->doctor->full_name}.",
            ClinicEventNotification::TYPE_PRESCRIPTION,
            route('prescriptions.show', $prescription),
            Prescription::class,
            $prescription->id,
        ));
    }

    public function notifyBillingCreated(Billing $billing): void
    {
        $billing->loadMissing('patient');

        $this->notifyRole('Cashier', new ClinicEventNotification(
            'Unpaid bill created',
            "{$billing->invoice_number} for {$billing->patient->full_name} is awaiting payment.",
            ClinicEventNotification::TYPE_BILLING,
            route('billings.show', $billing),
            Billing::class,
            $billing->id,
        ));
    }

    public function notifyLaboratoryResultUploaded(LaboratoryRequest $laboratoryRequest): void
    {
        $laboratoryRequest->loadMissing(['patient', 'doctor.user']);

        if ($laboratoryRequest->doctor->user === null) {
            return;
        }

        $this->notifyUser($laboratoryRequest->doctor->user, new ClinicEventNotification(
            'Laboratory result uploaded',
            "Results for {$laboratoryRequest->lab_request_number} / {$laboratoryRequest->patient->full_name} are now available.",
            ClinicEventNotification::TYPE_LABORATORY,
            route('laboratory-requests.show', $laboratoryRequest),
            LaboratoryRequest::class,
            $laboratoryRequest->id,
        ));
    }

    public function notifyLowStock(Medicine $medicine): void
    {
        $this->notifyRole('Administrator', new ClinicEventNotification(
            'Low stock medicine',
            "{$medicine->name} is at {$medicine->current_stock} {$medicine->unit}; reorder level is {$medicine->reorder_level}.",
            ClinicEventNotification::TYPE_INVENTORY,
            route('medicines.edit', $medicine),
            Medicine::class,
            $medicine->id,
        ));
    }

    private function notifyUser(User $user, ClinicEventNotification $notification): void
    {
        $user->notify($notification);
    }

    private function notifyRole(string $roleName, ClinicEventNotification $notification): void
    {
        User::query()
            ->role($roleName)
            ->where('is_active', true)
            ->get()
            ->each(fn (User $user) => $this->notifyUser($user, $notification));
    }

    /**
     * @param  Builder<DatabaseNotification>  $query
     * @param  array{search?: string|null, type?: string|null}  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (filled($filters['type'] ?? null)) {
            $query->where('data->notification_type', $filters['type']);
        }

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];

            $query->where(function (Builder $query) use ($search): void {
                $query->where('data->title', 'like', "%{$search}%")
                    ->orWhere('data->message', 'like', "%{$search}%");
            });
        }
    }

    private function format(DatabaseNotification $n): array
    {
        $title = $n->data['title'] ?? $this->legacyTitle($n);
        $message = $n->data['message'] ?? $this->legacyMessage($n);
        $notificationType = $n->data['notification_type'] ?? $this->mapType($n);

        return [
            'id' => $n->id,
            'user_id' => $n->notifiable_id,
            'title' => $title,
            'message' => $message,
            'type' => $notificationType,
            'notification_type' => $notificationType,
            'is_read' => $n->read_at !== null,
            'action_url' => $n->data['action_url'] ?? null,
            'old_role' => $n->data['old_role'] ?? null,
            'new_role' => $n->data['new_role'] ?? null,
            'changed_by' => $n->data['changed_by'] ?? null,
            'read_at' => $n->read_at,
            'created_at' => $n->created_at->toIso8601String(),
        ];
    }

    private function mapType($n): string
    {
        if (str_contains($n->type, 'UserRoleChanged')) {
            return ClinicEventNotification::TYPE_SYSTEM;
        }

        return $n->data['notification_type'] ?? ClinicEventNotification::TYPE_SYSTEM;
    }

    private function legacyTitle(DatabaseNotification $n): string
    {
        if (str_contains($n->type, 'UserRoleChanged')) {
            return 'Role updated';
        }

        return 'Notification';
    }

    private function legacyMessage(DatabaseNotification $n): string
    {
        if (str_contains($n->type, 'UserRoleChanged')) {
            return sprintf(
                'Changed from %s to %s by %s.',
                $n->data['old_role'] ?? 'none',
                $n->data['new_role'] ?? 'none',
                $n->data['changed_by'] ?? 'system',
            );
        }

        return 'System notification';
    }
}
