<?php

namespace App\Policies;

use App\Models\Consultation;
use App\Models\MedicalCertificate;
use App\Models\Patient;
use App\Models\User;

class MedicalCertificatePolicy
{
    public function view(User $user, MedicalCertificate $certificate): bool
    {
        if ($user->can('medical-certificates.view')) {
            return true;
        }

        if ($user->can('medical-certificates.doctor.view') && $user->doctor()->value('id') === $certificate->doctor_id) {
            return true;
        }

        return (bool) config('clinic.patient_portal_enabled')
            && $user->can('medical-certificates.own.view')
            && $user->patient()->value('id') === $certificate->patient_id;
    }

    public function createCertificate(User $user, Consultation $consultation): bool
    {
        return $user->can('medical-certificates.create')
            && $user->doctor()->value('id') === $consultation->doctor_id
            && $consultation->status === Consultation::STATUS_COMPLETED;
    }

    public function viewPatientHistory(User $user, Patient $patient): bool
    {
        if ($user->can('medical-certificates.view')) {
            return true;
        }

        if ($user->can('medical-certificates.doctor.view')) {
            $doctorId = $user->doctor()->value('id');

            if ($doctorId !== null && $patient->medicalCertificates()->where('doctor_id', $doctorId)->exists()) {
                return true;
            }
        }

        return (bool) config('clinic.patient_portal_enabled')
            && $user->can('medical-certificates.own.view')
            && $user->patient()->value('id') === $patient->id;
    }
}
