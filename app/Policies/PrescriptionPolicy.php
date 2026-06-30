<?php

namespace App\Policies;

use App\Models\Consultation;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;

class PrescriptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('prescriptions.view')
            || ($user->can('prescriptions.doctor.view') && $user->doctor()->exists())
            || $this->canUsePatientPortal($user);
    }

    public function view(User $user, Prescription $prescription): bool
    {
        if ($user->can('prescriptions.view')) {
            return true;
        }

        if ($user->can('prescriptions.doctor.view') && $user->doctor()->value('id') === $prescription->doctor_id) {
            return true;
        }

        return $this->canUsePatientPortal($user) && $user->patient()->value('id') === $prescription->patient_id;
    }

    public function createPrescription(User $user, Consultation $consultation): bool
    {
        return $user->can('prescriptions.create')
            && $user->doctor()->value('id') === $consultation->doctor_id
            && $consultation->status !== Consultation::STATUS_CANCELLED;
    }

    public function dispense(User $user, Prescription $prescription): bool
    {
        return $user->can('prescriptions.dispense');
    }

    public function viewPatientHistory(User $user, Patient $patient): bool
    {
        if ($user->can('prescriptions.view')) {
            return true;
        }

        if ($user->can('prescriptions.doctor.view')) {
            $doctorId = $user->doctor()->value('id');

            if ($doctorId !== null && $patient->prescriptions()->where('doctor_id', $doctorId)->exists()) {
                return true;
            }
        }

        return $this->canUsePatientPortal($user) && $user->patient()->value('id') === $patient->id;
    }

    private function canUsePatientPortal(User $user): bool
    {
        return (bool) config('clinic.patient_portal_enabled')
            && $user->can('prescriptions.own.view')
            && $user->patient()->exists();
    }
}
