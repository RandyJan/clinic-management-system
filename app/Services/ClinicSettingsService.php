<?php

namespace App\Services;

use App\Models\ClinicSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ClinicSettingsService
{
    private const CACHE_KEY = 'clinic-settings:current';

    public function current(): ClinicSetting
    {
        return Cache::remember(self::CACHE_KEY, now()->addDay(), function (): ClinicSetting {
            return ClinicSetting::query()->firstOrCreate([], [
                'clinic_name' => config('app.name', 'Clinic Management System'),
                'consultation_default_fee' => 0,
                'tax_rate' => 0,
                'appointment_slot_duration' => 30,
            ]);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function publicData(): array
    {
        $settings = $this->current();

        return [
            'clinic_name' => $settings->clinic_name,
            'clinic_address' => $settings->clinic_address,
            'contact_number' => $settings->contact_number,
            'email' => $settings->email,
            'logo_url' => $settings->logo_path ? Storage::disk('public')->url($settings->logo_path) : null,
            'consultation_default_fee' => (float) $settings->consultation_default_fee,
            'tax_rate' => (float) $settings->tax_rate,
            'appointment_slot_duration' => $settings->appointment_slot_duration,
            'opening_time' => $this->formatTime($settings->opening_time),
            'closing_time' => $this->formatTime($settings->closing_time),
            'receipt_footer' => $settings->receipt_footer,
            'certificate_footer' => $settings->certificate_footer,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(array $data, ?UploadedFile $logo = null): ClinicSetting
    {
        $settings = $this->current();

        if ($logo instanceof UploadedFile) {
            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }

            $data['logo_path'] = $logo->store('clinic-logos', 'public');
        }

        $settings->fill($data);
        $settings->save();

        $this->clearCache();

        return $settings->refresh();
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    private function formatTime(?string $time): ?string
    {
        if ($time === null) {
            return null;
        }

        return Carbon::parse($time)->format('H:i');
    }
}
