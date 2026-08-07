<?php

namespace App\Models;

use Database\Factories\ServiceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    /** @use HasFactory<ServiceFactory> */
    use HasFactory;

    public const CATEGORY_CONSULTATION = 'Consultation';

    public const CATEGORY_LABORATORY = 'Laboratory';

    public const CATEGORY_PROCEDURE = 'Procedure';

    public const CATEGORY_MEDICAL_CERTIFICATE = 'Medical Certificate';

    public const CATEGORY_OTHER = 'Other';

    /** @var list<string> */
    public const CATEGORIES = [
        self::CATEGORY_CONSULTATION,
        self::CATEGORY_LABORATORY,
        self::CATEGORY_PROCEDURE,
        self::CATEGORY_MEDICAL_CERTIFICATE,
        self::CATEGORY_OTHER,
    ];

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
    ];

    /** @var list<string> */
    protected $fillable = [
        'service_code',
        'name',
        'description',
        'category',
        'price',
        'status',
    ];

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => self::STATUS_ACTIVE,
    ];

    /** @return HasMany<ServicePriceHistory, $this> */
    public function priceHistories(): HasMany
    {
        return $this->hasMany(ServicePriceHistory::class);
    }

    /** @return HasMany<BillingItem, $this> */
    public function billingItems(): HasMany
    {
        return $this->hasMany(BillingItem::class);
    }

    /** @param Builder<Service> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', self::STATUS_ACTIVE);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }
}
