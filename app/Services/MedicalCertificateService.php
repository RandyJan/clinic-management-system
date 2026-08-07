<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\MedicalCertificate;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MedicalCertificateService
{
    /** @return array<string, mixed> */
    public function createContext(Consultation $consultation): array
    {
        $consultation->loadMissing(['patient', 'doctor']);

        return [
            'consultation' => [
                'id' => $consultation->id,
                'consultation_number' => $consultation->consultation_number,
                'patient_id' => $consultation->patient_id,
                'doctor_id' => $consultation->doctor_id,
                'diagnosis' => $consultation->diagnosis,
                'patient' => [
                    'id' => $consultation->patient->id,
                    'patient_code' => $consultation->patient->patient_code,
                    'full_name' => $consultation->patient->full_name,
                    'birthdate' => $consultation->patient->birthdate?->toDateString(),
                    'age' => $consultation->patient->age,
                    'gender' => $consultation->patient->gender,
                    'address' => $consultation->patient->address,
                ],
                'doctor' => [
                    'id' => $consultation->doctor->id,
                    'full_name' => $consultation->doctor->full_name,
                    'specialization' => $consultation->doctor->specialization,
                    'license_number' => $consultation->doctor->license_number,
                ],
            ],
        ];
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, User $actor): MedicalCertificate
    {
        return DB::transaction(function () use ($data, $actor): MedicalCertificate {
            $certificate = $this->createWithUniqueNumber([
                'patient_id' => $data['patient_id'],
                'consultation_id' => $data['consultation_id'],
                'doctor_id' => $data['doctor_id'],
                'diagnosis' => $data['diagnosis'],
                'recommendation' => $data['recommendation'],
                'rest_days' => $data['rest_days'] ?? null,
                'issued_date' => $data['issued_date'],
                'remarks' => $data['remarks'] ?? null,
            ]);

            activity('medical-certificate-management')
                ->causedBy($actor)
                ->performedOn($certificate)
                ->event('created')
                ->log('Issued medical certificate');

            return $certificate;
        });
    }

    /** @return array<string, mixed> */
    public function detail(MedicalCertificate $certificate): array
    {
        $certificate->loadMissing([
            'patient:id,patient_code,first_name,middle_name,last_name,suffix,birthdate,gender,address',
            'consultation:id,consultation_number,chief_complaint,created_at',
            'doctor:id,first_name,last_name,specialization,license_number',
        ]);

        return [
            'id' => $certificate->id,
            'certificate_number' => $certificate->certificate_number,
            'patient_id' => $certificate->patient_id,
            'consultation_id' => $certificate->consultation_id,
            'doctor_id' => $certificate->doctor_id,
            'diagnosis' => $certificate->diagnosis,
            'recommendation' => $certificate->recommendation,
            'rest_days' => $certificate->rest_days,
            'issued_date' => $certificate->issued_date?->toDateString(),
            'remarks' => $certificate->remarks,
            'created_at' => $certificate->created_at?->toIso8601String(),
            'updated_at' => $certificate->updated_at?->toIso8601String(),
            'patient' => [
                'id' => $certificate->patient->id,
                'patient_code' => $certificate->patient->patient_code,
                'full_name' => $certificate->patient->full_name,
                'birthdate' => $certificate->patient->birthdate?->toDateString(),
                'age' => $certificate->patient->age,
                'gender' => $certificate->patient->gender,
                'address' => $certificate->patient->address,
            ],
            'consultation' => [
                'id' => $certificate->consultation->id,
                'consultation_number' => $certificate->consultation->consultation_number,
                'chief_complaint' => $certificate->consultation->chief_complaint,
            ],
            'doctor' => [
                'id' => $certificate->doctor->id,
                'full_name' => $certificate->doctor->full_name,
                'specialization' => $certificate->doctor->specialization,
                'license_number' => $certificate->doctor->license_number,
            ],
        ];
    }

    /** @return Collection<int, array<string, mixed>> */
    public function historyForPatient(Patient $patient): Collection
    {
        return MedicalCertificate::query()
            ->whereBelongsTo($patient)
            ->with(['consultation:id,consultation_number', 'doctor:id,first_name,last_name,specialization'])
            ->latest('issued_date')
            ->limit(10)
            ->get()
            ->map(fn (MedicalCertificate $certificate): array => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'consultation_id' => $certificate->consultation_id,
                'diagnosis' => $certificate->diagnosis,
                'recommendation' => $certificate->recommendation,
                'rest_days' => $certificate->rest_days,
                'issued_date' => $certificate->issued_date?->toDateString(),
                'doctor' => [
                    'id' => $certificate->doctor->id,
                    'full_name' => $certificate->doctor->full_name,
                    'specialization' => $certificate->doctor->specialization,
                ],
                'consultation' => [
                    'id' => $certificate->consultation->id,
                    'consultation_number' => $certificate->consultation->consultation_number,
                ],
            ]);
    }

    /** @param array<string, mixed> $data */
    private function createWithUniqueNumber(array $data): MedicalCertificate
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return MedicalCertificate::create([...$data, 'certificate_number' => $this->generateCertificateNumber()]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return MedicalCertificate::create([...$data, 'certificate_number' => $this->generateCertificateNumber()]);
    }

    private function generateCertificateNumber(): string
    {
        do {
            $number = 'MC-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (MedicalCertificate::query()->where('certificate_number', $number)->exists());

        return $number;
    }
}
