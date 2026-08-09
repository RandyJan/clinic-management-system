<?php

namespace App\Models;

use Database\Factories\ClinicSettingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClinicSetting extends Model
{
    /** @use HasFactory<ClinicSettingFactory> */
    use HasFactory;

    protected $fillable = [
        'clinic_name',
        'clinic_address',
        'contact_number',
        'email',
        'logo_path',
        'consultation_default_fee',
        'tax_rate',
        'appointment_slot_duration',
        'opening_time',
        'closing_time',
        'receipt_footer',
        'certificate_footer',
    ];

    protected $attributes = [
        'clinic_name' => 'Clinic Management System',
        'consultation_default_fee' => 0,
        'tax_rate' => 0,
        'appointment_slot_duration' => 30,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'consultation_default_fee' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'appointment_slot_duration' => 'integer',
        ];
    }
}
