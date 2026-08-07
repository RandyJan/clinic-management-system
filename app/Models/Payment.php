<?php

namespace App\Models;

use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    public const METHOD_CASH = 'Cash';

    public const METHOD_GCASH = 'GCash';

    public const METHOD_MAYA = 'Maya';

    public const METHOD_BANK_TRANSFER = 'Bank Transfer';

    public const METHOD_CARD = 'Card';

    public const METHOD_HMO = 'HMO';

    public const METHOD_OTHER = 'Other';

    /** @var list<string> */
    public const METHODS = [
        self::METHOD_CASH,
        self::METHOD_GCASH,
        self::METHOD_MAYA,
        self::METHOD_BANK_TRANSFER,
        self::METHOD_CARD,
        self::METHOD_HMO,
        self::METHOD_OTHER,
    ];

    /** @var list<string> */
    protected $fillable = [
        'billing_id',
        'payment_reference',
        'payment_method',
        'amount_paid',
        'change_amount',
        'payment_date',
        'received_by',
        'remarks',
    ];

    /** @return BelongsTo<Billing, $this> */
    public function billing(): BelongsTo
    {
        return $this->belongsTo(Billing::class);
    }

    /** @return BelongsTo<User, $this> */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'payment_date' => 'datetime',
        ];
    }
}
