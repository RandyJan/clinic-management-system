<?php

namespace App\Policies;

use App\Models\Billing;
use App\Models\User;

class BillingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('billing.view')
            || $this->canUsePatientPortal($user);
    }

    public function view(User $user, Billing $billing): bool
    {
        if ($user->can('billing.view')) {
            return true;
        }

        return $this->canUsePatientPortal($user)
            && $user->patient()->value('id') === $billing->patient_id;
    }

    public function create(User $user): bool
    {
        return $user->can('billing.create');
    }

    public function update(User $user, Billing $billing): bool
    {
        if (! $user->can('billing.update')) {
            return false;
        }

        return $billing->payment_status !== Billing::STATUS_PAID || $user->can('billing.admin');
    }

    public function recordPayment(User $user, Billing $billing): bool
    {
        return $user->can('billing.payments.create')
            && ! in_array($billing->payment_status, [Billing::STATUS_PAID, Billing::STATUS_CANCELLED], true);
    }

    public function cancel(User $user, Billing $billing): bool
    {
        return $user->can('billing.cancel')
            && $billing->payment_status !== Billing::STATUS_CANCELLED;
    }

    private function canUsePatientPortal(User $user): bool
    {
        return (bool) config('clinic.patient_portal_enabled')
            && $user->can('billing.own.view')
            && $user->patient()->exists();
    }
}
