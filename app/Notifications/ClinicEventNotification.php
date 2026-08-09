<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ClinicEventNotification extends Notification
{
    use Queueable;

    public const TYPE_APPOINTMENT = 'Appointment';

    public const TYPE_BILLING = 'Billing';

    public const TYPE_PRESCRIPTION = 'Prescription';

    public const TYPE_LABORATORY = 'Laboratory';

    public const TYPE_INVENTORY = 'Inventory';

    public const TYPE_SYSTEM = 'System';

    public function __construct(
        private readonly string $title,
        private readonly string $message,
        private readonly string $notificationType,
        private readonly ?string $actionUrl = null,
        private readonly ?string $referenceType = null,
        private readonly ?int $referenceId = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->payload());
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->payload();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'notification_type' => $this->notificationType,
            'action_url' => $this->actionUrl,
            'reference_type' => $this->referenceType,
            'reference_id' => $this->referenceId,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
