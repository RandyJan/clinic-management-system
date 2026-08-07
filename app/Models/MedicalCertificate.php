<?php

namespace App\Models;

use Database\Factories\MedicalCertificateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalCertificate extends Model
{
    /** @use HasFactory<MedicalCertificateFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'certificate_number',
        'patient_id',
        'consultation_id',
        'doctor_id',
        'diagnosis',
        'recommendation',
        'rest_days',
        'issued_date',
        'remarks',
    ];

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<Consultation, $this> */
    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    /** @return BelongsTo<Doctor, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'issued_date' => 'date',
            'rest_days' => 'integer',
        ];
    }
}
