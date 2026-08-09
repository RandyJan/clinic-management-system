<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class UserRoleChanged extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private readonly User $changedUser,
        private readonly User $changedByUser,
        private readonly ?string $oldRole,
        private readonly ?string $newRole,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the broadcasted representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'title' => 'Role updated',
            'message' => "Your role was changed to {$this->newRole}.",
            'notification_type' => ClinicEventNotification::TYPE_SYSTEM,
            'user_id' => $this->changedUser->id,
            'user_name' => $this->changedUser->name,
            'old_role' => $this->oldRole,
            'new_role' => $this->newRole,
            'changed_by' => $this->changedByUser->name,
        ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Role updated',
            'message' => "Your role was changed to {$this->newRole}.",
            'notification_type' => ClinicEventNotification::TYPE_SYSTEM,
            'user_id' => $this->changedUser->id,
            'user_name' => $this->changedUser->name,
            'old_role' => $this->oldRole,
            'new_role' => $this->newRole,
            'changed_by' => $this->changedByUser->name,
            'changed_at' => now()->toIso8601String(),
        ];
    }
}
