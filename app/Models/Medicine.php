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
        'name',
        'unit',
        'stock_quantity',
        'is_active',
    ];

    protected $attributes = [
        'unit' => 'unit',
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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stock_quantity' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
