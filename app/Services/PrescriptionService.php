<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PrescriptionService
{
    /**
     * @param  array{search?: string|null, status?: string|null, patient_id?: int|null}  $filters
     */
    public function list(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Prescription::query()
            ->select(['id', 'prescription_number', 'consultation_id', 'patient_id', 'doctor_id', 'status', 'created_at', 'dispensed_at'])
            ->with([
                'patient:id,patient_code,first_name,middle_name,last_name,suffix,user_id',
                'doctor:id,first_name,last_name,specialization',
            ])
            ->withCount('items')
            ->latest();

        $this->scopeForActor($query, $actor);

        if (filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }

        if (filled($filters['patient_id'] ?? null)) {
            $query->where('patient_id', $filters['patient_id']);
        }

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];
            $query->where(function (Builder $query) use ($search): void {
                $query->where('prescription_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function (Builder $query) use ($search): void {
                        $query->where('patient_code', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('middle_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        return $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Prescription $prescription): array => $this->summary($prescription));
    }

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
                'patient' => [
                    'full_name' => $consultation->patient->full_name,
                    'patient_code' => $consultation->patient->patient_code,
                ],
                'doctor' => [
                    'full_name' => $consultation->doctor->full_name,
                    'specialization' => $consultation->doctor->specialization,
                ],
            ],
            'medicines' => Medicine::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'unit', 'stock_quantity'])
                ->map(fn (Medicine $medicine): array => [
                    'id' => $medicine->id,
                    'sku' => $medicine->sku,
                    'name' => $medicine->name,
                    'unit' => $medicine->unit,
                    'stock_quantity' => $medicine->stock_quantity,
                ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $actor): Prescription
    {
        return DB::transaction(function () use ($data, $actor): Prescription {
            $items = collect($data['items']);
            $medicineNames = $this->medicineNames($items);
            $prescription = $this->createWithUniqueNumber([
                'consultation_id' => $data['consultation_id'],
                'patient_id' => $data['patient_id'],
                'doctor_id' => $data['doctor_id'],
                'status' => Prescription::STATUS_PENDING,
                'notes' => $data['notes'] ?? null,
                'medications' => $medicineNames->implode("\n"),
                'instructions' => null,
            ]);

            $prescription->items()->createMany(
                $items->map(function (array $item, int $index) use ($medicineNames): array {
                    return [
                        'medicine_id' => $item['medicine_id'] ?? null,
                        'medicine_name' => $medicineNames->get($index),
                        'dosage' => $item['dosage'],
                        'frequency' => $item['frequency'],
                        'duration' => $item['duration'],
                        'quantity' => $item['quantity'],
                        'instructions' => $item['instructions'] ?? null,
                    ];
                })->all()
            );

            activity('prescription-management')
                ->causedBy($actor)
                ->performedOn($prescription)
                ->event('created')
                ->log('Created prescription');

            return $prescription;
        });
    }

    public function dispense(Prescription $prescription, User $actor): Prescription
    {
        return DB::transaction(function () use ($prescription, $actor): Prescription {
            $lockedPrescription = Prescription::query()->lockForUpdate()->findOrFail($prescription->id);

            if ($lockedPrescription->status !== Prescription::STATUS_PENDING) {
                throw ValidationException::withMessages(['prescription' => 'Only pending prescriptions can be dispensed.']);
            }

            $items = PrescriptionItem::query()->whereBelongsTo($lockedPrescription)->get();
            $quantities = $items
                ->whereNotNull('medicine_id')
                ->groupBy('medicine_id')
                ->map(fn (Collection $items): int => $items->sum('quantity'));
            $medicines = Medicine::query()
                ->whereKey($quantities->keys())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($quantities as $medicineId => $quantity) {
                $medicine = $medicines->get($medicineId);

                if ($medicine === null || $medicine->stock_quantity < $quantity) {
                    $name = $medicine?->name ?? 'Selected medicine';
                    throw ValidationException::withMessages([
                        'prescription' => "Insufficient stock for {$name}.",
                    ]);
                }
            }

            foreach ($quantities as $medicineId => $quantity) {
                $medicines->get($medicineId)->decrement('stock_quantity', $quantity);
            }

            $lockedPrescription->forceFill([
                'status' => Prescription::STATUS_DISPENSED,
                'dispensed_by' => $actor->id,
                'dispensed_at' => now(),
            ])->save();

            activity('prescription-management')
                ->causedBy($actor)
                ->performedOn($lockedPrescription)
                ->withProperties(['status' => Prescription::STATUS_DISPENSED])
                ->event('updated')
                ->log('Dispensed prescription');

            return $lockedPrescription;
        });
    }

    /** @return array<string, mixed> */
    public function detail(Prescription $prescription): array
    {
        $prescription->loadMissing([
            'consultation:id,consultation_number,diagnosis,created_at',
            'patient:id,patient_code,first_name,middle_name,last_name,suffix,birthdate,address',
            'doctor:id,first_name,last_name,specialization,license_number',
            'dispenser:id,name',
            'items:id,prescription_id,medicine_id,medicine_name,dosage,frequency,duration,quantity,instructions',
            'items.medicine:id,unit,stock_quantity',
        ]);

        return [
            ...$this->summary($prescription),
            'notes' => $prescription->notes,
            'dispensed_by' => $prescription->dispenser?->name,
            'consultation' => [
                'id' => $prescription->consultation->id,
                'consultation_number' => $prescription->consultation->consultation_number,
                'diagnosis' => $prescription->consultation->diagnosis,
            ],
            'patient' => [
                'id' => $prescription->patient->id,
                'patient_code' => $prescription->patient->patient_code,
                'full_name' => $prescription->patient->full_name,
                'birthdate' => $prescription->patient->birthdate?->toDateString(),
                'address' => $prescription->patient->address,
            ],
            'doctor' => [
                'id' => $prescription->doctor->id,
                'full_name' => $prescription->doctor->full_name,
                'specialization' => $prescription->doctor->specialization,
                'license_number' => $prescription->doctor->license_number,
            ],
            'items' => $prescription->items->map(fn (PrescriptionItem $item): array => [
                'id' => $item->id,
                'medicine_id' => $item->medicine_id,
                'medicine_name' => $item->medicine_name,
                'dosage' => $item->dosage,
                'frequency' => $item->frequency,
                'duration' => $item->duration,
                'quantity' => $item->quantity,
                'instructions' => $item->instructions,
                'unit' => $item->medicine?->unit,
                'stock_quantity' => $item->medicine?->stock_quantity,
            ])->values(),
        ];
    }

    /**
     * Keeps prescriptions entered through the existing consultation form readable by this module.
     *
     * @param  array<string, mixed>  $data
     */
    public function upsertLegacyPrescription(Consultation $consultation, array $data): void
    {
        if (blank($data['prescription_medications'] ?? null)) {
            return;
        }

        $prescription = Prescription::query()->firstOrNew(['consultation_id' => $consultation->id]);

        if (! $prescription->exists) {
            $prescription->prescription_number = $this->generatePrescriptionNumber();
            $prescription->status = Prescription::STATUS_PENDING;
        }

        $prescription->fill([
            'patient_id' => $consultation->patient_id,
            'doctor_id' => $consultation->doctor_id,
            'medications' => $data['prescription_medications'],
            'instructions' => $data['prescription_instructions'] ?? null,
        ])->save();
    }

    /** @return array<string, mixed> */
    private function summary(Prescription $prescription): array
    {
        return [
            'id' => $prescription->id,
            'prescription_number' => $prescription->prescription_number ?? 'Legacy prescription',
            'consultation_id' => $prescription->consultation_id,
            'patient_id' => $prescription->patient_id,
            'doctor_id' => $prescription->doctor_id,
            'status' => $prescription->status,
            'items_count' => $prescription->items_count ?? $prescription->items->count(),
            'created_at' => $prescription->created_at?->toIso8601String(),
            'updated_at' => $prescription->updated_at?->toIso8601String(),
            'dispensed_at' => $prescription->dispensed_at?->toIso8601String(),
            'patient' => [
                'id' => $prescription->patient->id,
                'patient_code' => $prescription->patient->patient_code,
                'full_name' => $prescription->patient->full_name,
            ],
            'doctor' => [
                'id' => $prescription->doctor->id,
                'full_name' => $prescription->doctor->full_name,
                'specialization' => $prescription->doctor->specialization,
            ],
        ];
    }

    /** @param Collection<int, array<string, mixed>> $items */
    private function medicineNames(Collection $items): Collection
    {
        $medicines = Medicine::query()
            ->whereKey($items->pluck('medicine_id')->filter()->unique())
            ->get(['id', 'name'])
            ->keyBy('id');

        return $items->map(fn (array $item): string => isset($item['medicine_id'])
            ? $medicines->get($item['medicine_id'])->name
            : $item['medicine_name']);
    }

    /** @param array<string, mixed> $data */
    private function createWithUniqueNumber(array $data): Prescription
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return Prescription::create([...$data, 'prescription_number' => $this->generatePrescriptionNumber()]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return Prescription::create([...$data, 'prescription_number' => $this->generatePrescriptionNumber()]);
    }

    private function generatePrescriptionNumber(): string
    {
        do {
            $number = 'RX-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Prescription::query()->where('prescription_number', $number)->exists());

        return $number;
    }

    private function scopeForActor(Builder $query, User $actor): void
    {
        if ($actor->can('prescriptions.view')) {
            return;
        }

        if ($actor->can('prescriptions.doctor.view')) {
            $query->where('doctor_id', $actor->doctor()->value('id') ?? 0);

            return;
        }

        if ((bool) config('clinic.patient_portal_enabled') && $actor->can('prescriptions.own.view')) {
            $query->where('patient_id', $actor->patient()->value('id') ?? 0);

            return;
        }

        $query->whereKey(0);
    }
}
