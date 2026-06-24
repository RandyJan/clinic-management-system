<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PatientService
{
    /**
     * @param  array{search?: string|null, status?: string|null}  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Patient::query()
            ->select([
                'id',
                'patient_code',
                'first_name',
                'middle_name',
                'last_name',
                'suffix',
                'gender',
                'birthdate',
                'contact_number',
                'email',
                'status',
                'updated_at',
            ])
            ->orderByDesc('updated_at');

        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search): void {
                $query->where('patient_code', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (($filters['status'] ?? null) === 'active') {
            $query->where('status', 'active');
        }

        if (($filters['status'] ?? null) === 'inactive') {
            $query->where('status', 'inactive');
        }

        return $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Patient $patient): array => $this->summary($patient));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $actor): Patient
    {
        return DB::transaction(function () use ($data, $actor): Patient {
            $patient = $this->createWithUniqueCode($data);

            activity('patient-management')
                ->causedBy($actor)
                ->performedOn($patient)
                ->event('created')
                ->log('Registered patient');

            return $patient;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Patient $patient, array $data, User $actor): Patient
    {
        $patient->fill($data);
        $patient->save();

        activity('patient-management')
            ->causedBy($actor)
            ->performedOn($patient)
            ->event('updated')
            ->log('Updated patient');

        return $patient;
    }

    public function deactivate(Patient $patient, User $actor): void
    {
        if ($patient->status === 'inactive') {
            return;
        }

        $patient->forceFill(['status' => 'inactive'])->save();

        activity('patient-management')
            ->causedBy($actor)
            ->performedOn($patient)
            ->withProperties(['status' => 'inactive'])
            ->event('updated')
            ->log('Deactivated patient');
    }

    /**
     * @return array<string, mixed>
     */
    public function profile(Patient $patient): array
    {
        return [
            'patient' => $this->detail($patient),
            'medical_history' => $this->medicalHistory($patient),
        ];
    }

    /**
     * @return array{appointments: Collection<int, array<string, mixed>>, consultations: Collection<int, array<string, mixed>>, prescriptions: Collection<int, array<string, mixed>>, laboratory_requests: Collection<int, array<string, mixed>>, billing_history: Collection<int, array<string, mixed>>}
     */
    public function medicalHistory(Patient $patient): array
    {
        return [
            'appointments' => collect(),
            'consultations' => collect(),
            'prescriptions' => collect(),
            'laboratory_requests' => collect(),
            'billing_history' => collect(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(Patient $patient): array
    {
        return [
            ...$this->summary($patient),
            'civil_status' => $patient->civil_status,
            'address' => $patient->address,
            'emergency_contact_name' => $patient->emergency_contact_name,
            'emergency_contact_number' => $patient->emergency_contact_number,
            'blood_type' => $patient->blood_type,
            'allergies' => $patient->allergies,
            'existing_conditions' => $patient->existing_conditions,
            'created_at' => $patient->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Patient $patient): array
    {
        return [
            'id' => $patient->id,
            'patient_code' => $patient->patient_code,
            'first_name' => $patient->first_name,
            'middle_name' => $patient->middle_name,
            'last_name' => $patient->last_name,
            'suffix' => $patient->suffix,
            'full_name' => $patient->full_name,
            'gender' => $patient->gender,
            'birthdate' => $patient->birthdate?->toDateString(),
            'age' => $patient->age,
            'contact_number' => $patient->contact_number,
            'email' => $patient->email,
            'status' => $patient->status,
            'updated_at' => $patient->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createWithUniqueCode(array $data): Patient
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return Patient::create([
                    ...$data,
                    'patient_code' => $this->generatePatientCode(),
                    'status' => $data['status'] ?? 'active',
                ]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return Patient::create([
            ...$data,
            'patient_code' => $this->generatePatientCode(),
            'status' => $data['status'] ?? 'active',
        ]);
    }

    private function generatePatientCode(): string
    {
        do {
            $code = 'PAT-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Patient::query()->where('patient_code', $code)->exists());

        return $code;
    }
}
