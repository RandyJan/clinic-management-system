<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class DoctorService
{
    /**
     * @param  array{search?: string|null, status?: string|null, specialization?: string|null}  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Doctor::query()
            ->with(['user:id,name,email,username,is_active'])
            ->select([
                'id',
                'user_id',
                'doctor_code',
                'first_name',
                'last_name',
                'specialization',
                'license_number',
                'contact_number',
                'email',
                'consultation_fee',
                'schedule',
                'status',
                'updated_at',
            ])
            ->orderBy('last_name')
            ->orderBy('first_name');

        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search): void {
                $query->where('doctor_code', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('specialization', 'like', "%{$search}%")
                    ->orWhere('license_number', 'like', "%{$search}%")
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

        if (! empty($filters['specialization'])) {
            $query->where('specialization', $filters['specialization']);
        }

        return $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Doctor $doctor): array => $this->summary($doctor));
    }

    /**
     * @return Collection<int, array{id: int, label: string, email: string|null}>
     */
    public function availableUsers(?Doctor $doctor = null): Collection
    {
        return User::query()
            ->select(['id', 'name', 'email', 'username'])
            ->where('is_active', true)
            ->where(function ($query) use ($doctor): void {
                $query->whereDoesntHave('doctor');

                if ($doctor !== null) {
                    $query->orWhereKey($doctor->user_id);
                }
            })
            ->orderBy('name')
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'label' => $user->name.' ('.($user->email ?? $user->username ?? 'No email').')',
                'email' => $user->email,
            ]);
    }

    /**
     * @return Collection<int, string>
     */
    public function specializations(): Collection
    {
        return Doctor::query()
            ->whereNotNull('specialization')
            ->distinct()
            ->orderBy('specialization')
            ->pluck('specialization');
    }

    /**
     * @return Collection<int, array{id: int, name: string, specialization: string, consultation_fee: string}>
     */
    public function activeAssignmentOptions(): Collection
    {
        return Doctor::query()
            ->where('status', 'active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'specialization', 'consultation_fee'])
            ->map(fn (Doctor $doctor): array => [
                'id' => $doctor->id,
                'name' => $doctor->full_name,
                'specialization' => $doctor->specialization,
                'consultation_fee' => $doctor->consultation_fee,
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $actor): Doctor
    {
        return DB::transaction(function () use ($data, $actor): Doctor {
            $doctor = $this->createWithUniqueCode($data);
            $this->assignDoctorRole($doctor->user);

            activity('doctor-management')
                ->causedBy($actor)
                ->performedOn($doctor)
                ->event('created')
                ->log('Created doctor profile');

            return $doctor;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Doctor $doctor, array $data, User $actor): Doctor
    {
        return DB::transaction(function () use ($doctor, $data, $actor): Doctor {
            $doctor->fill($data);
            $doctor->save();
            $doctor->load('user');
            $this->assignDoctorRole($doctor->user);

            activity('doctor-management')
                ->causedBy($actor)
                ->performedOn($doctor)
                ->event('updated')
                ->log('Updated doctor profile');

            return $doctor;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function profile(Doctor $doctor): array
    {
        return [
            'doctor' => $this->detail($doctor->loadMissing('user')),
            'appointments' => collect(),
            'consultations' => collect(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(Doctor $doctor): array
    {
        return [
            ...$this->summary($doctor),
            'created_at' => $doctor->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Doctor $doctor): array
    {
        return [
            'id' => $doctor->id,
            'user_id' => $doctor->user_id,
            'doctor_code' => $doctor->doctor_code,
            'first_name' => $doctor->first_name,
            'last_name' => $doctor->last_name,
            'full_name' => $doctor->full_name,
            'specialization' => $doctor->specialization,
            'license_number' => $doctor->license_number,
            'contact_number' => $doctor->contact_number,
            'email' => $doctor->email,
            'consultation_fee' => $doctor->consultation_fee,
            'schedule' => $doctor->schedule,
            'status' => $doctor->status,
            'user' => $doctor->user ? [
                'id' => $doctor->user->id,
                'name' => $doctor->user->name,
                'email' => $doctor->user->email,
                'username' => $doctor->user->username,
                'is_active' => $doctor->user->is_active,
            ] : null,
            'updated_at' => $doctor->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createWithUniqueCode(array $data): Doctor
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return Doctor::create([
                    ...$data,
                    'doctor_code' => $this->generateDoctorCode(),
                    'status' => $data['status'] ?? 'active',
                ]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return Doctor::create([
            ...$data,
            'doctor_code' => $this->generateDoctorCode(),
            'status' => $data['status'] ?? 'active',
        ]);
    }

    private function generateDoctorCode(): string
    {
        do {
            $code = 'DOC-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Doctor::query()->where('doctor_code', $code)->exists());

        return $code;
    }

    private function assignDoctorRole(User $user): void
    {
        $role = Role::firstOrCreate([
            'name' => 'Doctor',
            'guard_name' => 'web',
        ]);

        if (! $user->hasRole($role)) {
            $user->assignRole($role);
        }
    }
}
