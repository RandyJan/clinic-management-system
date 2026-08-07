<?php

namespace App\Models;

use Database\Factories\BillingItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingItem extends Model
{
    /** @use HasFactory<BillingItemFactory> */
    use HasFactory;

    public const TYPE_CONSULTATION = 'Consultation fee';

    public const TYPE_LABORATORY = 'Laboratory fee';

    public const TYPE_MEDICINE = 'Medicine fee';

    public const TYPE_OTHER = 'Other clinic charge';

    /** @var list<string> */
    public const TYPES = [
        self::TYPE_CONSULTATION,
        self::TYPE_LABORATORY,
        self::TYPE_MEDICINE,
        self::TYPE_OTHER,
        Service::CATEGORY_CONSULTATION,
        Service::CATEGORY_LABORATORY,
        Service::CATEGORY_PROCEDURE,
        Service::CATEGORY_MEDICAL_CERTIFICATE,
        Service::CATEGORY_OTHER,
    ];

    /** @var list<string> */
    protected $fillable = [
        'billing_id',
        'service_id',
        'item_type',
        'description',
        'quantity',
        'unit_price',
        'total_price',
    ];

    /** @return BelongsTo<Billing, $this> */
    public function billing(): BelongsTo
    {
        return $this->belongsTo(Billing::class);
    }

    /** @return BelongsTo<Service, $this> */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }
}
