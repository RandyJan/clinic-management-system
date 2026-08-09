<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\StockTransaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MedicineInventoryService
{
    public function __construct(private readonly NotificationService $notificationService) {}

    /** @param array{search?: string|null, category?: string|null, status?: string|null} $filters */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Medicine::query()
            ->select($this->medicineColumns())
            ->latest();

        $this->applyFilters($query, $filters);

        return $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Medicine $medicine): array => $this->summary($medicine));
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, User $actor): Medicine
    {
        return DB::transaction(function () use ($data, $actor): Medicine {
            $initialStock = (int) $data['current_stock'];
            $medicine = $this->createWithUniqueCode([
                ...$this->attributesFromData($data),
                'current_stock' => $initialStock,
                'stock_quantity' => $initialStock,
                'is_active' => ($data['status'] ?? Medicine::STATUS_ACTIVE) === Medicine::STATUS_ACTIVE,
            ]);

            if ($initialStock > 0) {
                $this->recordTransaction(
                    $medicine,
                    StockTransaction::TYPE_STOCK_IN,
                    $initialStock,
                    0,
                    $initialStock,
                    $actor,
                    remarks: 'Initial stock'
                );
            }

            activity('medicine-inventory')
                ->causedBy($actor)
                ->performedOn($medicine)
                ->event('created')
                ->log('Created medicine');

            if ($this->isLowStock($medicine)) {
                $this->notificationService->notifyLowStock($medicine);
            }

            return $medicine;
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Medicine $medicine, array $data, User $actor): Medicine
    {
        return DB::transaction(function () use ($medicine, $data, $actor): Medicine {
            $lockedMedicine = Medicine::query()->lockForUpdate()->findOrFail($medicine->id);
            $status = $data['status'] ?? Medicine::STATUS_ACTIVE;
            $wasLowStock = $this->isLowStock($lockedMedicine);

            $lockedMedicine->forceFill([
                ...$this->attributesFromData($data),
                'stock_quantity' => $lockedMedicine->current_stock,
                'is_active' => $status === Medicine::STATUS_ACTIVE,
            ])->save();

            activity('medicine-inventory')
                ->causedBy($actor)
                ->performedOn($lockedMedicine)
                ->event('updated')
                ->log('Updated medicine');

            if (! $wasLowStock && $this->isLowStock($lockedMedicine)) {
                $this->notificationService->notifyLowStock($lockedMedicine);
            }

            return $lockedMedicine->refresh();
        });
    }

    /** @param array{transaction_type: string, quantity: int|string, remarks?: string|null} $data */
    public function adjustStock(Medicine $medicine, array $data, User $actor): Medicine
    {
        return DB::transaction(function () use ($medicine, $data, $actor): Medicine {
            $lockedMedicine = Medicine::query()->lockForUpdate()->findOrFail($medicine->id);
            $previousStock = (int) $lockedMedicine->current_stock;
            $quantity = (int) $data['quantity'];
            $transactionType = $data['transaction_type'];
            $newStock = match ($transactionType) {
                StockTransaction::TYPE_STOCK_IN, StockTransaction::TYPE_RETURNED => $previousStock + $quantity,
                StockTransaction::TYPE_STOCK_OUT, StockTransaction::TYPE_EXPIRED => $previousStock - $quantity,
                StockTransaction::TYPE_ADJUSTMENT => $quantity,
                default => $previousStock,
            };

            if ($newStock < 0) {
                throw ValidationException::withMessages(['quantity' => 'Stock cannot be reduced below zero.']);
            }

            $lockedMedicine->forceFill([
                'current_stock' => $newStock,
                'stock_quantity' => $newStock,
            ])->save();

            $this->recordTransaction(
                $lockedMedicine,
                $transactionType,
                $transactionType === StockTransaction::TYPE_ADJUSTMENT
                    ? abs($newStock - $previousStock)
                    : $quantity,
                $previousStock,
                $newStock,
                $actor,
                remarks: $data['remarks'] ?? null
            );

            activity('medicine-inventory')
                ->causedBy($actor)
                ->performedOn($lockedMedicine)
                ->withProperties(['previous_stock' => $previousStock, 'new_stock' => $newStock])
                ->event('updated')
                ->log('Updated medicine stock');

            if ($previousStock > (int) $lockedMedicine->reorder_level && $this->isLowStock($lockedMedicine)) {
                $this->notificationService->notifyLowStock($lockedMedicine);
            }

            return $lockedMedicine->refresh();
        });
    }

    public function dispense(Medicine $medicine, int $quantity, Prescription $prescription, User $actor): void
    {
        $previousStock = (int) $medicine->current_stock;
        $newStock = $previousStock - $quantity;

        if ($newStock < 0) {
            throw ValidationException::withMessages([
                'prescription' => "Insufficient stock for {$medicine->name}.",
            ]);
        }

        $medicine->forceFill([
            'current_stock' => $newStock,
            'stock_quantity' => $newStock,
        ])->save();

        $this->recordTransaction(
            $medicine,
            StockTransaction::TYPE_DISPENSED,
            $quantity,
            $previousStock,
            $newStock,
            $actor,
            Prescription::class,
            $prescription->id,
            "Dispensed {$prescription->prescription_number}"
        );

        if ($previousStock > (int) $medicine->reorder_level && $this->isLowStock($medicine)) {
            $this->notificationService->notifyLowStock($medicine);
        }
    }

    /** @return array<string, mixed> */
    public function detail(Medicine $medicine): array
    {
        return $this->summary($medicine);
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    public function transactions(Medicine $medicine, int $perPage = 15): LengthAwarePaginator
    {
        return $medicine->stockTransactions()
            ->with('creator:id,name')
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (StockTransaction $transaction): array => $this->transactionSummary($transaction));
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    public function lowStock(int $perPage = 15): LengthAwarePaginator
    {
        return Medicine::query()
            ->select($this->medicineColumns())
            ->whereColumn('current_stock', '<=', 'reorder_level')
            ->where('status', Medicine::STATUS_ACTIVE)
            ->orderBy('current_stock')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Medicine $medicine): array => $this->summary($medicine));
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    public function expiryReport(string $status = 'near-expiry', int $perPage = 15): LengthAwarePaginator
    {
        $query = Medicine::query()
            ->select($this->medicineColumns())
            ->whereNotNull('expiry_date');

        if ($status === 'expired') {
            $query->whereDate('expiry_date', '<', now()->toDateString());
        } else {
            $query->whereDate('expiry_date', '>=', now()->toDateString())
                ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString());
        }

        return $query
            ->orderBy('expiry_date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Medicine $medicine): array => $this->summary($medicine));
    }

    /** @return Collection<int, string> */
    public function categories(): Collection
    {
        return Medicine::query()
            ->whereNotNull('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->merge(Medicine::CATEGORIES)
            ->unique()
            ->values();
    }

    /** @return array<string, mixed> */
    private function attributesFromData(array $data): array
    {
        $status = $data['status'] ?? Medicine::STATUS_ACTIVE;

        return [
            'name' => $data['name'],
            'generic_name' => $data['generic_name'] ?? null,
            'brand_name' => $data['brand_name'] ?? null,
            'category' => $data['category'],
            'dosage_form' => $data['dosage_form'] ?? null,
            'strength' => $data['strength'] ?? null,
            'unit' => $data['unit'],
            'reorder_level' => (int) $data['reorder_level'],
            'expiry_date' => $data['expiry_date'] ?? null,
            'selling_price' => $data['selling_price'],
            'cost_price' => $data['cost_price'] ?? 0,
            'status' => $status,
        ];
    }

    /** @param array{search?: string|null, category?: string|null, status?: string|null} $filters */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (filled($filters['category'] ?? null)) {
            $query->where('category', $filters['category']);
        }

        if (filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];
            $query->where(function (Builder $query) use ($search): void {
                $query->where('medicine_code', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('generic_name', 'like', "%{$search}%")
                    ->orWhere('brand_name', 'like', "%{$search}%");
            });
        }
    }

    /** @return array<string, mixed> */
    private function summary(Medicine $medicine): array
    {
        return [
            'id' => $medicine->id,
            'medicine_code' => $medicine->medicine_code ?? $medicine->sku,
            'sku' => $medicine->medicine_code ?? $medicine->sku,
            'name' => $medicine->name,
            'generic_name' => $medicine->generic_name,
            'brand_name' => $medicine->brand_name,
            'category' => $medicine->category,
            'dosage_form' => $medicine->dosage_form,
            'strength' => $medicine->strength,
            'unit' => $medicine->unit,
            'current_stock' => (int) $medicine->current_stock,
            'stock_quantity' => (int) $medicine->current_stock,
            'reorder_level' => (int) $medicine->reorder_level,
            'expiry_date' => $medicine->expiry_date?->toDateString(),
            'selling_price' => (float) $medicine->selling_price,
            'cost_price' => (float) $medicine->cost_price,
            'status' => $medicine->status,
            'created_at' => $medicine->created_at?->toIso8601String(),
            'updated_at' => $medicine->updated_at?->toIso8601String(),
            'is_low_stock' => (int) $medicine->current_stock <= (int) $medicine->reorder_level,
            'is_expired' => $medicine->expiry_date !== null && $medicine->expiry_date->lt(now()->startOfDay()),
            'is_near_expiry' => $medicine->expiry_date !== null
                && $medicine->expiry_date->gte(now()->startOfDay())
                && $medicine->expiry_date->lte(now()->addDays(30)),
        ];
    }

    private function transactionSummary(StockTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'medicine_id' => $transaction->medicine_id,
            'transaction_type' => $transaction->transaction_type,
            'quantity' => $transaction->quantity,
            'previous_stock' => $transaction->previous_stock,
            'new_stock' => $transaction->new_stock,
            'reference_type' => $transaction->reference_type,
            'reference_id' => $transaction->reference_id,
            'remarks' => $transaction->remarks,
            'created_by' => $transaction->creator?->name,
            'created_at' => $transaction->created_at?->toIso8601String(),
        ];
    }

    private function recordTransaction(
        Medicine $medicine,
        string $transactionType,
        int $quantity,
        int $previousStock,
        int $newStock,
        User $actor,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $remarks = null
    ): StockTransaction {
        return StockTransaction::create([
            'medicine_id' => $medicine->id,
            'transaction_type' => $transactionType,
            'quantity' => $quantity,
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'remarks' => $remarks,
            'created_by' => $actor->id,
        ]);
    }

    private function isLowStock(Medicine $medicine): bool
    {
        return $medicine->status === Medicine::STATUS_ACTIVE
            && (int) $medicine->current_stock <= (int) $medicine->reorder_level;
    }

    /** @param array<string, mixed> $data */
    private function createWithUniqueCode(array $data): Medicine
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                $medicineCode = $this->generateMedicineCode();

                return Medicine::create([
                    ...$data,
                    'medicine_code' => $medicineCode,
                    'sku' => $medicineCode,
                ]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        $medicineCode = $this->generateMedicineCode();

        return Medicine::create([
            ...$data,
            'medicine_code' => $medicineCode,
            'sku' => $medicineCode,
        ]);
    }

    private function generateMedicineCode(): string
    {
        do {
            $code = 'MED-'.now()->format('Ymd').'-'.Str::upper(Str::random(5));
        } while (Medicine::query()->where('medicine_code', $code)->orWhere('sku', $code)->exists());

        return $code;
    }

    /** @return list<string> */
    private function medicineColumns(): array
    {
        return [
            'id',
            'sku',
            'medicine_code',
            'name',
            'generic_name',
            'brand_name',
            'category',
            'dosage_form',
            'strength',
            'unit',
            'current_stock',
            'reorder_level',
            'expiry_date',
            'selling_price',
            'cost_price',
            'status',
            'created_at',
            'updated_at',
        ];
    }
}
