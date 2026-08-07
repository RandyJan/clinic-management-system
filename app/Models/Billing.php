<?php

namespace App\Models;

use Database\Factories\BillingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Billing extends Model
{
    /** @use HasFactory<BillingFactory> */
    use HasFactory;

    public const STATUS_UNPAID = 'Unpaid';

    public const STATUS_PARTIALLY_PAID = 'Partially Paid';

    public const STATUS_PAID = 'Paid';

    public const STATUS_CANCELLED = 'Cancelled';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_UNPAID,
        self::STATUS_PARTIALLY_PAID,
        self::STATUS_PAID,
        self::STATUS_CANCELLED,
    ];

    /** @var list<string> */
    protected $fillable = [
        'invoice_number',
        'patient_id',
        'appointment_id',
        'consultation_id',
        'total_amount',
        'discount',
        'tax',
        'grand_total',
        'payment_status',
        'created_by',
        'cancelled_remarks',
        'cancelled_at',
    ];

    /** @var array<string, mixed> */
    protected $attributes = [
        'payment_status' => self::STATUS_UNPAID,
        'total_amount' => 0,
        'discount' => 0,
        'tax' => 0,
        'grand_total' => 0,
    ];

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<Appointment, $this> */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /** @return BelongsTo<Consultation, $this> */
    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<BillingItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(BillingItem::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'cancelled_at' => 'datetime',
        ];
    }
}
