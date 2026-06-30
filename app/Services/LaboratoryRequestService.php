<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\LaboratoryRequest;
use App\Models\LaboratoryResult;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class LaboratoryRequestService
{
    /** @param array{search?: string|null, status?: string|null} $filters */
    public function list(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = LaboratoryRequest::query()
            ->select(['id', 'lab_request_number', 'consultation_id', 'patient_id', 'doctor_id', 'requested_tests', 'tests', 'status', 'requested_at', 'completed_at'])
            ->with([
                'patient:id,user_id,patient_code,first_name,middle_name,last_name,suffix',
                'doctor:id,first_name,last_name,specialization',
            ])
            ->withExists('labResult')
            ->latest('requested_at');

        $this->scopeForActor($query, $actor);

        if (filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];
            $query->where(function (Builder $query) use ($search): void {
                $query->where('lab_request_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function (Builder $query) use ($search): void {
                        $query->where('patient_code', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('middle_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage)->withQueryString()->through(
            fn (LaboratoryRequest $request): array => $this->summary($request)
        );
    }

    /** @return array<string, mixed> */
    public function createContext(Consultation $consultation): array
    {
        $consultation->loadMissing(['patient', 'doctor']);

        return ['consultation' => [
            'id' => $consultation->id,
            'consultation_number' => $consultation->consultation_number,
            'patient_id' => $consultation->patient_id,
            'doctor_id' => $consultation->doctor_id,
            'patient' => ['full_name' => $consultation->patient->full_name, 'patient_code' => $consultation->patient->patient_code],
            'doctor' => ['full_name' => $consultation->doctor->full_name, 'specialization' => $consultation->doctor->specialization],
        ]];
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, User $actor): LaboratoryRequest
    {
        return DB::transaction(function () use ($data, $actor): LaboratoryRequest {
            $tests = collect($data['requested_tests'])->map(fn (string $test): string => trim($test))->filter()->values();
            $laboratoryRequest = $this->createWithUniqueNumber([
                'consultation_id' => $data['consultation_id'],
                'patient_id' => $data['patient_id'],
                'doctor_id' => $data['doctor_id'],
                'requested_tests' => $tests->all(),
                'clinical_notes' => $data['clinical_notes'] ?? null,
                'status' => LaboratoryRequest::STATUS_PENDING,
                'requested_at' => now(),
                'tests' => $tests->implode(', '),
                'instructions' => $data['clinical_notes'] ?? null,
            ]);

            activity('laboratory-request-management')->causedBy($actor)->performedOn($laboratoryRequest)
                ->event('created')->log('Created laboratory request');

            return $laboratoryRequest;
        });
    }

    public function updateStatus(LaboratoryRequest $laboratoryRequest, string $status, User $actor): LaboratoryRequest
    {
        return DB::transaction(function () use ($laboratoryRequest, $status, $actor): LaboratoryRequest {
            $lockedRequest = LaboratoryRequest::query()->lockForUpdate()->findOrFail($laboratoryRequest->id);

            if ($status === LaboratoryRequest::STATUS_COMPLETED && ! $lockedRequest->labResult()->exists()) {
                throw ValidationException::withMessages(['status' => 'Upload result details before completing the laboratory request.']);
            }

            $lockedRequest->forceFill([
                'status' => $status,
                'completed_at' => $status === LaboratoryRequest::STATUS_COMPLETED ? now() : null,
            ])->save();

            activity('laboratory-request-management')->causedBy($actor)->performedOn($lockedRequest)
                ->withProperties(['status' => $status])->event('updated')->log('Updated laboratory request status');

            return $lockedRequest;
        });
    }

    /** @param array<string, mixed> $data */
    public function uploadResult(LaboratoryRequest $laboratoryRequest, array $data, ?UploadedFile $attachment, User $actor): LaboratoryResult
    {
        $newPath = $attachment?->store('lab-results', 'local');
        $oldPath = $laboratoryRequest->labResult()->value('attachment_path');

        try {
            $result = DB::transaction(function () use ($laboratoryRequest, $data, $newPath, $oldPath, $actor): LaboratoryResult {
                $lockedRequest = LaboratoryRequest::query()->lockForUpdate()->findOrFail($laboratoryRequest->id);
                if ($lockedRequest->status === LaboratoryRequest::STATUS_CANCELLED) {
                    throw ValidationException::withMessages(['result_details' => 'A cancelled request cannot receive results.']);
                }

                $result = LaboratoryResult::query()->updateOrCreate(
                    ['lab_request_id' => $lockedRequest->id],
                    [
                        'result_details' => $data['result_details'],
                        'attachment_path' => $newPath ?? $oldPath,
                        'remarks' => $data['remarks'] ?? null,
                        'uploaded_by' => $actor->id,
                        'uploaded_at' => now(),
                    ]
                );

                $lockedRequest->forceFill([
                    'status' => LaboratoryRequest::STATUS_COMPLETED,
                    'completed_at' => now(),
                    'result' => $data['result_details'],
                    'result_notes' => $data['remarks'] ?? null,
                    'resulted_at' => now(),
                ])->save();

                activity('laboratory-result-management')->causedBy($actor)->performedOn($result)
                    ->event($result->wasRecentlyCreated ? 'created' : 'updated')->log('Uploaded laboratory result');

                return $result;
            });
        } catch (Throwable $exception) {
            if ($newPath !== null) {
                Storage::disk('local')->delete($newPath);
            }
            throw $exception;
        }

        if ($newPath !== null && $oldPath !== null && $oldPath !== $newPath) {
            Storage::disk('local')->delete($oldPath);
        }

        return $result;
    }

    /** @return array<string, mixed> */
    public function detail(LaboratoryRequest $laboratoryRequest): array
    {
        $laboratoryRequest->loadMissing([
            'consultation:id,consultation_number,diagnosis',
            'patient:id,patient_code,first_name,middle_name,last_name,suffix,birthdate,address',
            'doctor:id,first_name,last_name,specialization,license_number',
            'labResult.uploader:id,name',
        ]);

        return [
            ...$this->summary($laboratoryRequest),
            'clinical_notes' => $laboratoryRequest->clinical_notes ?? $laboratoryRequest->instructions,
            'consultation' => [
                'id' => $laboratoryRequest->consultation->id,
                'consultation_number' => $laboratoryRequest->consultation->consultation_number,
                'diagnosis' => $laboratoryRequest->consultation->diagnosis,
            ],
            'patient' => [
                'id' => $laboratoryRequest->patient->id,
                'patient_code' => $laboratoryRequest->patient->patient_code,
                'full_name' => $laboratoryRequest->patient->full_name,
                'birthdate' => $laboratoryRequest->patient->birthdate?->toDateString(),
                'address' => $laboratoryRequest->patient->address,
            ],
            'doctor' => [
                'id' => $laboratoryRequest->doctor->id,
                'full_name' => $laboratoryRequest->doctor->full_name,
                'specialization' => $laboratoryRequest->doctor->specialization,
                'license_number' => $laboratoryRequest->doctor->license_number,
            ],
            'result' => $laboratoryRequest->labResult ? [
                'id' => $laboratoryRequest->labResult->id,
                'result_details' => $laboratoryRequest->labResult->result_details,
                'remarks' => $laboratoryRequest->labResult->remarks,
                'has_attachment' => filled($laboratoryRequest->labResult->attachment_path),
                'uploaded_by' => $laboratoryRequest->labResult->uploader?->name,
                'uploaded_at' => $laboratoryRequest->labResult->uploaded_at?->toIso8601String(),
            ] : null,
        ];
    }

    /** @param array<string, mixed> $data */
    public function upsertLegacyRequest(Consultation $consultation, array $data): void
    {
        if (blank($data['laboratory_tests'] ?? null)) {
            return;
        }

        $tests = str((string) $data['laboratory_tests'])->split('/[\r\n,]+/')->map(fn (string $test): string => trim($test))->filter()->values();
        $request = LaboratoryRequest::query()->firstOrNew(['consultation_id' => $consultation->id]);
        if (! $request->exists) {
            $request->lab_request_number = $this->generateLabRequestNumber();
            $request->status = LaboratoryRequest::STATUS_PENDING;
            $request->requested_at = now();
        }
        $request->fill([
            'patient_id' => $consultation->patient_id,
            'doctor_id' => $consultation->doctor_id,
            'requested_tests' => $tests->all(),
            'clinical_notes' => $data['laboratory_instructions'] ?? null,
            'tests' => $data['laboratory_tests'],
            'instructions' => $data['laboratory_instructions'] ?? null,
        ])->save();
    }

    /** @return array<string, mixed> */
    private function summary(LaboratoryRequest $request): array
    {
        return [
            'id' => $request->id,
            'lab_request_number' => $request->lab_request_number ?? 'Legacy lab request',
            'consultation_id' => $request->consultation_id,
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'requested_tests' => $request->requested_tests ?? str((string) $request->tests)->split('/[\r\n,]+/')->filter()->values()->all(),
            'status' => $request->status,
            'has_result' => (bool) ($request->lab_result_exists ?? $request->labResult?->exists),
            'requested_at' => $request->requested_at?->toIso8601String() ?? $request->created_at?->toIso8601String(),
            'completed_at' => $request->completed_at?->toIso8601String(),
            'created_at' => $request->created_at?->toIso8601String(),
            'updated_at' => $request->updated_at?->toIso8601String(),
            'patient' => ['id' => $request->patient->id, 'patient_code' => $request->patient->patient_code, 'full_name' => $request->patient->full_name],
            'doctor' => ['id' => $request->doctor->id, 'full_name' => $request->doctor->full_name, 'specialization' => $request->doctor->specialization],
        ];
    }

    /** @param array<string, mixed> $data */
    private function createWithUniqueNumber(array $data): LaboratoryRequest
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return LaboratoryRequest::create([...$data, 'lab_request_number' => $this->generateLabRequestNumber()]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return LaboratoryRequest::create([...$data, 'lab_request_number' => $this->generateLabRequestNumber()]);
    }

    private function generateLabRequestNumber(): string
    {
        do {
            $number = 'LAB-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (LaboratoryRequest::query()->where('lab_request_number', $number)->exists());

        return $number;
    }

    private function scopeForActor(Builder $query, User $actor): void
    {
        if ($actor->can('laboratory-requests.view')) {
            return;
        }
        if ($actor->can('laboratory-requests.doctor.view')) {
            $query->where('doctor_id', $actor->doctor()->value('id') ?? 0);

            return;
        }
        if ((bool) config('clinic.patient_portal_enabled') && $actor->can('laboratory-requests.own.view')) {
            $query->where('patient_id', $actor->patient()->value('id') ?? 0);

            return;
        }
        $query->whereKey(0);
    }
}
