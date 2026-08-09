<?php

namespace Database\Factories;

use App\Models\ClinicSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClinicSetting>
 */
class ClinicSettingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'clinic_name' => fake()->company().' Clinic',
            'clinic_address' => fake()->address(),
            'contact_number' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'logo_path' => null,
            'consultation_default_fee' => fake()->randomFloat(2, 300, 1500),
            'tax_rate' => fake()->randomFloat(2, 0, 12),
            'appointment_slot_duration' => fake()->randomElement([15, 30, 45, 60]),
            'opening_time' => '08:00',
            'closing_time' => '17:00',
            'receipt_footer' => 'Thank you for choosing our clinic.',
            'certificate_footer' => 'This certificate is valid only with authorized clinic signature.',
        ];
    }
}
