<?php

namespace App\Models;

use Database\Factories\StockTransactionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransaction extends Model
{
    /** @use HasFactory<StockTransactionFactory> */
    use HasFactory;

    public const TYPE_STOCK_IN = 'Stock In';

    public const TYPE_STOCK_OUT = 'Stock Out';

    public const TYPE_ADJUSTMENT = 'Adjustment';

    public const TYPE_DISPENSED = 'Dispensed';

    public const TYPE_RETURNED = 'Returned';

    public const TYPE_EXPIRED = 'Expired';

    /** @var list<string> */
    public const TYPES = [
        self::TYPE_STOCK_IN,
        self::TYPE_STOCK_OUT,
        self::TYPE_ADJUSTMENT,
        self::TYPE_DISPENSED,
        self::TYPE_RETURNED,
        self::TYPE_EXPIRED,
    ];

    /** @var list<string> */
    protected $fillable = [
        'medicine_id',
        'transaction_type',
        'quantity',
        'previous_stock',
        'new_stock',
        'reference_type',
        'reference_id',
        'remarks',
        'created_by',
    ];

    /** @return BelongsTo<Medicine, $this> */
    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'previous_stock' => 'integer',
            'new_stock' => 'integer',
        ];
    }
}
