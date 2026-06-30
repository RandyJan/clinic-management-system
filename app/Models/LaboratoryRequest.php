<?php

namespace App\Models;

use Database\Factories\LaboratoryRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LaboratoryRequest extends Model
{
    /** @use HasFactory<LaboratoryRequestFactory> */
    use HasFactory;

    public const STATUS_PENDING = 'Pending';

    public const STATUS_IN_PROGRESS = 'In Progress';

    public const STATUS_COMPLETED = 'Completed';

    public const STATUS_CANCELLED = 'Cancelled';

    /** @var list<string> */
    public const STATUSES = [self::STATUS_PENDING, self::STATUS_IN_PROGRESS, self::STATUS_COMPLETED, self::STATUS_CANCELLED];

    /** @var list<string> */
    protected $fillable = [
        'lab_request_number',
        'consultation_id',
        'patient_id',
        'doctor_id',
        'requested_tests',
        'clinical_notes',
        'status',
        'requested_at',
        'completed_at',
        'tests',
        'instructions',
        'result',
        'result_notes',
        'resulted_at',
    ];

    protected $attributes = ['status' => self::STATUS_PENDING];

    /** @return BelongsTo<Consultation, $this> */
    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<Doctor, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /** @return HasOne<LaboratoryResult, $this> */
    public function labResult(): HasOne
    {
        return $this->hasOne(LaboratoryResult::class, 'lab_request_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'requested_tests' => 'array',
            'requested_at' => 'datetime',
            'completed_at' => 'datetime',
            'resulted_at' => 'datetime',
        ];
    }
}
