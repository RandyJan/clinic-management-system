<?php

namespace App\Policies;

use App\Models\Consultation;
use App\Models\LaboratoryRequest;
use App\Models\User;

class LaboratoryRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('laboratory-requests.view')
            || ($user->can('laboratory-requests.doctor.view') && $user->doctor()->exists())
            || $this->canUsePatientPortal($user);
    }

    public function view(User $user, LaboratoryRequest $laboratoryRequest): bool
    {
        if ($user->can('laboratory-requests.view')) {
            return true;
        }

        if ($user->can('laboratory-requests.doctor.view') && $user->doctor()->value('id') === $laboratoryRequest->doctor_id) {
            return true;
        }

        return $this->canUsePatientPortal($user) && $user->patient()->value('id') === $laboratoryRequest->patient_id;
    }

    public function createLabRequest(User $user, Consultation $consultation): bool
    {
        return $user->can('laboratory-requests.create')
            && $user->doctor()->value('id') === $consultation->doctor_id
            && $consultation->status !== Consultation::STATUS_CANCELLED;
    }

    public function updateStatus(User $user, LaboratoryRequest $laboratoryRequest): bool
    {
        return $user->can('laboratory-requests.update-status');
    }

    public function uploadResult(User $user, LaboratoryRequest $laboratoryRequest): bool
    {
        return $user->can('laboratory-requests.upload-results')
            && $laboratoryRequest->status !== LaboratoryRequest::STATUS_CANCELLED;
    }

    private function canUsePatientPortal(User $user): bool
    {
        return (bool) config('clinic.patient_portal_enabled')
            && $user->can('laboratory-requests.own.view')
            && $user->patient()->exists();
    }
}
