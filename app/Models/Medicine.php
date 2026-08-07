<?php

namespace App\Models;

use Database\Factories\MedicineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Medicine extends Model
{
    /** @use HasFactory<MedicineFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
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
        'stock_quantity',
        'is_active',
    ];

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
    ];

    /** @var list<string> */
    public const CATEGORIES = [
        'Analgesic',
        'Antibiotic',
        'Antihistamine',
        'Antacid',
        'Vitamin',
        'Other',
    ];

    /** @var list<string> */
    public const DOSAGE_FORMS = [
        'Tablet',
        'Capsule',
        'Syrup',
        'Suspension',
        'Injection',
        'Cream',
        'Drops',
        'Other',
    ];

    protected $attributes = [
        'unit' => 'unit',
        'current_stock' => 0,
        'reorder_level' => 0,
        'selling_price' => 0,
        'cost_price' => 0,
        'status' => self::STATUS_ACTIVE,
        'stock_quantity' => 0,
        'is_active' => true,
    ];

    /**
     * @return HasMany<PrescriptionItem, $this>
     */
    public function prescriptionItems(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    /** @return HasMany<StockTransaction, $this> */
    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function setCurrentStockAttribute(mixed $value): void
    {
        $stock = (int) $value;

        $this->attributes['current_stock'] = $stock;
        $this->attributes['stock_quantity'] = $stock;
    }

    public function setStockQuantityAttribute(mixed $value): void
    {
        $stock = (int) $value;

        $this->attributes['stock_quantity'] = $stock;
        $this->attributes['current_stock'] = $stock;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'current_stock' => 'integer',
            'reorder_level' => 'integer',
            'expiry_date' => 'date',
            'selling_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
