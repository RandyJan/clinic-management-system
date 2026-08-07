<?php

namespace App\Services;

use App\Models\Service;
use App\Models\ServicePriceHistory;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServiceCatalogService
{
    /** @param array{search?: string|null, category?: string|null, status?: string|null} $filters */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Service::query()
            ->select(['id', 'service_code', 'name', 'description', 'category', 'price', 'status', 'created_at', 'updated_at'])
            ->latest();

        if (filled($filters['category'] ?? null)) {
            $query->where('category', $filters['category']);
        }

        if (filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];
            $query->where(function (Builder $query) use ($search): void {
                $query->where('service_code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Service $service): array => $this->summary($service));
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, User $actor): Service
    {
        return DB::transaction(function () use ($data, $actor): Service {
            $service = $this->createWithUniqueCode([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'],
                'price' => $data['price'],
                'status' => $data['status'] ?? Service::STATUS_ACTIVE,
            ]);

            activity('service-management')
                ->causedBy($actor)
                ->performedOn($service)
                ->event('created')
                ->log('Created clinic service');

            return $service;
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Service $service, array $data, User $actor): Service
    {
        return DB::transaction(function () use ($service, $data, $actor): Service {
            $lockedService = Service::query()->lockForUpdate()->findOrFail($service->id);
            $oldPrice = round((float) $lockedService->price, 2);
            $newPrice = round((float) $data['price'], 2);

            $lockedService->forceFill([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'],
                'price' => $newPrice,
                'status' => $data['status'] ?? Service::STATUS_ACTIVE,
            ])->save();

            if ($oldPrice !== $newPrice) {
                ServicePriceHistory::create([
                    'service_id' => $lockedService->id,
                    'old_price' => $oldPrice,
                    'new_price' => $newPrice,
                    'changed_by' => $actor->id,
                ]);
            }

            activity('service-management')
                ->causedBy($actor)
                ->performedOn($lockedService)
                ->withProperties(['old_price' => $oldPrice, 'new_price' => $newPrice])
                ->event('updated')
                ->log('Updated clinic service');

            return $lockedService->refresh();
        });
    }

    /** @return array<string, mixed> */
    public function detail(Service $service): array
    {
        $service->loadMissing('priceHistories.changer:id,name');

        return [
            ...$this->summary($service),
            'price_histories' => $service->priceHistories
                ->sortByDesc('created_at')
                ->map(fn (ServicePriceHistory $history): array => [
                    'id' => $history->id,
                    'old_price' => (float) $history->old_price,
                    'new_price' => (float) $history->new_price,
                    'changed_by' => $history->changer?->name,
                    'created_at' => $history->created_at?->toIso8601String(),
                ])
                ->values(),
        ];
    }

    /** @param Collection<int, int>|null $includeIds */
    public function billingOptions(?Collection $includeIds = null): Collection
    {
        return Service::query()
            ->when(
                $includeIds?->isNotEmpty(),
                fn (Builder $query): Builder => $query->where(function (Builder $query) use ($includeIds): void {
                    $query->active()->orWhereIn('id', $includeIds->all());
                }),
                fn (Builder $query): Builder => $query->active()
            )
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'service_code', 'name', 'category', 'price', 'status'])
            ->map(fn (Service $service): array => [
                'id' => $service->id,
                'service_code' => $service->service_code,
                'name' => $service->name,
                'category' => $service->category,
                'price' => (float) $service->price,
                'status' => $service->status,
            ]);
    }

    /** @return array<string, mixed> */
    private function summary(Service $service): array
    {
        return [
            'id' => $service->id,
            'service_code' => $service->service_code,
            'name' => $service->name,
            'description' => $service->description,
            'category' => $service->category,
            'price' => (float) $service->price,
            'status' => $service->status,
            'created_at' => $service->created_at?->toIso8601String(),
            'updated_at' => $service->updated_at?->toIso8601String(),
        ];
    }

    /** @param array<string, mixed> $data */
    private function createWithUniqueCode(array $data): Service
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return Service::create([...$data, 'service_code' => $this->generateServiceCode()]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return Service::create([...$data, 'service_code' => $this->generateServiceCode()]);
    }

    private function generateServiceCode(): string
    {
        do {
            $code = 'SVC-'.now()->format('Ymd').'-'.Str::upper(Str::random(5));
        } while (Service::query()->where('service_code', $code)->exists());

        return $code;
    }
}
