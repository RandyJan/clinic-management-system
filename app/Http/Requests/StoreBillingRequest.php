<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use App\Models\Billing;
use App\Models\BillingItem;
use App\Models\Consultation;
use App\Models\Patient;
use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBillingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $billing = $this->route('billing');

        if ($billing instanceof Billing) {
            return $this->user()?->can('update', $billing) ?? false;
        }

        return $this->user()?->can('create', Billing::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', Rule::exists((new Patient)->getTable(), 'id')],
            'appointment_id' => ['nullable', 'integer', Rule::exists((new Appointment)->getTable(), 'id')],
            'consultation_id' => ['nullable', 'integer', Rule::exists((new Consultation)->getTable(), 'id')],
            'discount' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'tax' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['nullable', 'integer', Rule::exists((new Service)->getTable(), 'id')],
            'items.*.item_type' => ['required', Rule::in(BillingItem::TYPES)],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $patientId = $this->integer('patient_id');

            $appointment = Appointment::query()->find($this->integer('appointment_id'));
            if ($appointment !== null && $appointment->patient_id !== $patientId) {
                $validator->errors()->add('appointment_id', 'The appointment does not belong to the selected patient.');
            }

            $consultation = Consultation::query()->find($this->integer('consultation_id'));
            if ($consultation !== null && $consultation->patient_id !== $patientId) {
                $validator->errors()->add('consultation_id', 'The consultation does not belong to the selected patient.');
            }

            if (! $this->route('billing') instanceof Billing) {
                $serviceIds = collect($this->input('items', []))
                    ->pluck('service_id')
                    ->filter()
                    ->unique()
                    ->values();

                if ($serviceIds->isNotEmpty()) {
                    $inactiveServiceIds = Service::query()
                        ->whereIn('id', $serviceIds->all())
                        ->where('status', '!=', Service::STATUS_ACTIVE)
                        ->pluck('id');

                    foreach ($this->input('items', []) as $index => $item) {
                        if ($inactiveServiceIds->contains((int) ($item['service_id'] ?? 0))) {
                            $validator->errors()->add("items.{$index}.service_id", 'Inactive services cannot be selected for new bills.');
                        }
                    }
                }
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'The patient is required.',
            'items.required' => 'Add at least one billing item.',
            'items.min' => 'Add at least one billing item.',
            'items.*.quantity.required' => 'The item quantity is required.',
            'items.*.quantity.numeric' => 'The item quantity must be numeric.',
            'items.*.unit_price.required' => 'The item unit price is required.',
            'items.*.unit_price.numeric' => 'The item unit price must be numeric.',
        ];
    }
}
