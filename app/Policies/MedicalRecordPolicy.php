<?php

namespace App\Policies;

use App\Models\Patient;
use App\Models\User;

class MedicalRecordPolicy
{
    public function viewAnyMedicalRecords(User $user): bool
    {
        return $user->can('medical-records.view')
            || ($user->can('medical-records.assigned.view') && $user->doctor()->exists())
            || $this->canUsePatientPortal($user);
    }

    public function viewMedicalRecord(User $user, Patient $patient): bool
    {
        if ($user->can('medical-records.view')) {
            return true;
        }

        if ($user->can('medical-records.assigned.view')) {
            $doctorId = $user->doctor()->value('id');

            if ($doctorId !== null && $patient->appointments()->where('doctor_id', $doctorId)->exists()) {
                return true;
            }
        }

        return $this->canUsePatientPortal($user) && $patient->user_id === $user->id;
    }

    private function canUsePatientPortal(User $user): bool
    {
        return (bool) config('clinic.patient_portal_enabled')
            && $user->can('medical-records.own.view')
            && $user->patient()->exists();
    }
}
