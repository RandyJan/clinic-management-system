<?php

namespace App\Models;

use Database\Factories\ClinicQueueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicQueue extends Model
{
    /** @use HasFactory<ClinicQueueFactory> */
    use HasFactory;

    public const STATUS_WAITING = 'Waiting';

    public const STATUS_CALLED = 'Called';

    public const STATUS_IN_CONSULTATION = 'In Consultation';

    public const STATUS_COMPLETED = 'Completed';

    public const STATUS_SKIPPED = 'Skipped';

    public const STATUS_CANCELLED = 'Cancelled';

    /** @var list<string> */
    public const ACTIVE_STATUSES = [
        self::STATUS_WAITING,
        self::STATUS_CALLED,
        self::STATUS_IN_CONSULTATION,
        self::STATUS_SKIPPED,
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'queue_number',
        'appointment_id',
        'patient_id',
        'doctor_id',
        'queue_date',
        'status',
        'checked_in_at',
        'called_at',
        'completed_at',
    ];

    protected $table = 'queues';

    /**
     * @return BelongsTo<Appointment, $this>
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * @return BelongsTo<Patient, $this>
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * @return BelongsTo<Doctor, $this>
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'queue_date' => 'date',
            'checked_in_at' => 'datetime',
            'called_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
