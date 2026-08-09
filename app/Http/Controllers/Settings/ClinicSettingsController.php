<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAppointmentSettingsRequest;
use App\Http\Requests\Settings\UpdateBillingSettingsRequest;
use App\Http\Requests\Settings\UpdateClinicProfileSettingsRequest;
use App\Http\Requests\Settings\UpdatePrintTemplateSettingsRequest;
use App\Services\ClinicSettingsService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClinicSettingsController extends Controller
{
    public function __construct(private readonly ClinicSettingsService $settings) {}

    public function clinic(): Response
    {
        return Inertia::render('settings/clinic', $this->payload());
    }

    public function billing(): Response
    {
        return Inertia::render('settings/billing', $this->payload());
    }

    public function appointment(): Response
    {
        return Inertia::render('settings/appointment', $this->payload());
    }

    public function printTemplates(): Response
    {
        return Inertia::render('settings/print-templates', $this->payload());
    }

    public function updateClinic(UpdateClinicProfileSettingsRequest $request): RedirectResponse
    {
        $data = collect($request->validated())->except('logo')->all();

        $this->settings->update($data, $request->file('logo'));

        return back()->with('success', 'Clinic profile settings updated.');
    }

    public function updateBilling(UpdateBillingSettingsRequest $request): RedirectResponse
    {
        $this->settings->update($request->validated());

        return back()->with('success', 'Billing settings updated.');
    }

    public function updateAppointment(UpdateAppointmentSettingsRequest $request): RedirectResponse
    {
        $this->settings->update($request->validated());

        return back()->with('success', 'Appointment settings updated.');
    }

    public function updatePrintTemplates(UpdatePrintTemplateSettingsRequest $request): RedirectResponse
    {
        $this->settings->update($request->validated());

        return back()->with('success', 'Print template settings updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        return ['settings' => $this->settings->publicData()];
    }
}
