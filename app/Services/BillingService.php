<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Billing;
use App\Models\BillingItem;
use App\Models\Consultation;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BillingService
{
    public function __construct(
        private readonly ServiceCatalogService $serviceCatalog,
        private readonly NotificationService $notificationService,
    ) {}

    /** @param array{search?: string|null, status?: string|null, patient_id?: int|null} $filters */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Billing::query()
            ->select([
                'id',
                'invoice_number',
                'patient_id',
                'appointment_id',
                'consultation_id',
                'total_amount',
                'discount',
                'tax',
                'grand_total',
                'payment_status',
                'created_at',
                'updated_at',
            ])
            ->with(['patient:id,patient_code,first_name,middle_name,last_name,suffix'])
            ->withSum('payments', 'amount_paid')
            ->latest();

        if (filled($filters['status'] ?? null)) {
            $query->where('payment_status', $filters['status']);
        }

        if (filled($filters['patient_id'] ?? null)) {
            $query->where('patient_id', $filters['patient_id']);
        }

        if (filled($filters['search'] ?? null)) {
            $search = $filters['search'];
            $query->where(function (Builder $query) use ($search): void {
                $query->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function (Builder $query) use ($search): void {
                        $query->where('patient_code', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('middle_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        return $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Billing $billing): array => $this->summary($billing));
    }

    /** @return array<string, mixed> */
    public function createContext(?Appointment $appointment = null, ?Consultation $consultation = null, ?Billing $billing = null): array
    {
        $appointment?->loadMissing(['patient', 'doctor', 'consultation']);
        $consultation?->loadMissing(['patient', 'doctor', 'appointment']);
        $billing?->loadMissing('items');

        $sourceAppointment = $appointment ?? $consultation?->appointment;
        $sourceConsultation = $consultation ?? $appointment?->consultation;
        $patient = $consultation?->patient ?? $appointment?->patient;
        $includedServiceIds = $billing instanceof Billing
            ? $billing->items->pluck('service_id')->filter()->values()
            : null;

        return [
            'source' => [
                'appointment_id' => $sourceAppointment?->id,
                'appointment_number' => $sourceAppointment?->appointment_number,
                'consultation_id' => $sourceConsultation?->id,
                'consultation_number' => $sourceConsultation?->consultation_number,
                'patient_id' => $patient?->id,
                'patient_name' => $patient?->full_name,
                'patient_code' => $patient?->patient_code,
            ],
            'patients' => $this->patientOptions(),
            'services' => $this->serviceCatalog->billingOptions($includedServiceIds),
            'item_types' => BillingItem::TYPES,
            'statuses' => Billing::STATUSES,
            'payment_methods' => Payment::METHODS,
        ];
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, User $actor): Billing
    {
        return DB::transaction(function () use ($data, $actor): Billing {
            $billing = $this->createWithUniqueNumber([
                'patient_id' => $data['patient_id'],
                'appointment_id' => $data['appointment_id'] ?? null,
                'consultation_id' => $data['consultation_id'] ?? null,
                'discount' => $data['discount'] ?? 0,
                'tax' => $data['tax'] ?? 0,
                'payment_status' => Billing::STATUS_UNPAID,
                'created_by' => $actor->id,
            ]);

            $this->replaceItems($billing, $data['items']);
            $this->recalculateTotals($billing);

            activity('billing-management')
                ->causedBy($actor)
                ->performedOn($billing)
                ->event('created')
                ->log('Created billing invoice');

            $this->notificationService->notifyBillingCreated($billing);

            return $billing->refresh();
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Billing $billing, array $data, User $actor): Billing
    {
        return DB::transaction(function () use ($billing, $data, $actor): Billing {
            $lockedBilling = Billing::query()->lockForUpdate()->findOrFail($billing->id);

            if ($lockedBilling->payment_status === Billing::STATUS_PAID && ! $actor->can('billing.admin')) {
                throw ValidationException::withMessages(['billing' => 'Paid bills can only be edited by an administrator.']);
            }

            if ($lockedBilling->payment_status === Billing::STATUS_CANCELLED) {
                throw ValidationException::withMessages(['billing' => 'Cancelled bills cannot be edited.']);
            }

            $lockedBilling->forceFill([
                'patient_id' => $data['patient_id'],
                'appointment_id' => $data['appointment_id'] ?? null,
                'consultation_id' => $data['consultation_id'] ?? null,
                'discount' => $data['discount'] ?? 0,
                'tax' => $data['tax'] ?? 0,
            ])->save();

            $this->replaceItems($lockedBilling, $data['items']);
            $this->recalculateTotals($lockedBilling);

            activity('billing-management')
                ->causedBy($actor)
                ->performedOn($lockedBilling)
                ->event('updated')
                ->log('Updated billing invoice');

            return $lockedBilling->refresh();
        });
    }

    /** @param array<string, mixed> $data */
    public function recordPayment(Billing $billing, array $data, User $actor): Payment
    {
        return DB::transaction(function () use ($billing, $data, $actor): Payment {
            $lockedBilling = Billing::query()->lockForUpdate()->findOrFail($billing->id);

            if ($lockedBilling->payment_status === Billing::STATUS_CANCELLED) {
                throw ValidationException::withMessages(['payment' => 'Cancelled bills cannot receive payments.']);
            }

            if ($lockedBilling->payment_status === Billing::STATUS_PAID) {
                throw ValidationException::withMessages(['payment' => 'This bill is already fully paid.']);
            }

            $balance = $this->balanceDue($lockedBilling);
            $amountPaid = round((float) $data['amount_paid'], 2);
            $appliedAmount = min($amountPaid, $balance);

            $payment = $this->createPaymentWithUniqueReference([
                'billing_id' => $lockedBilling->id,
                'payment_method' => $data['payment_method'],
                'amount_paid' => $appliedAmount,
                'change_amount' => max($amountPaid - $balance, 0),
                'payment_date' => now(),
                'received_by' => $actor->id,
                'remarks' => $data['remarks'] ?? null,
            ]);

            $this->updatePaymentStatus($lockedBilling);

            activity('billing-payment-management')
                ->causedBy($actor)
                ->performedOn($payment)
                ->event('created')
                ->log('Recorded billing payment');

            return $payment;
        });
    }

    public function cancel(Billing $billing, string $remarks, User $actor): Billing
    {
        return DB::transaction(function () use ($billing, $remarks, $actor): Billing {
            $lockedBilling = Billing::query()->lockForUpdate()->findOrFail($billing->id);

            $lockedBilling->forceFill([
                'payment_status' => Billing::STATUS_CANCELLED,
                'cancelled_remarks' => $remarks,
                'cancelled_at' => now(),
            ])->save();

            activity('billing-management')
                ->causedBy($actor)
                ->performedOn($lockedBilling)
                ->withProperties(['remarks' => $remarks])
                ->event('updated')
                ->log('Cancelled billing invoice');

            return $lockedBilling->refresh();
        });
    }

    /** @return array<string, mixed> */
    public function detail(Billing $billing): array
    {
        $billing->loadMissing([
            'patient:id,patient_code,first_name,middle_name,last_name,suffix,address',
            'appointment:id,appointment_number,appointment_date,appointment_time',
            'consultation:id,consultation_number,diagnosis',
            'creator:id,name',
            'items:id,billing_id,service_id,item_type,description,quantity,unit_price,total_price',
            'payments.receiver:id,name',
        ]);

        return [
            ...$this->summary($billing),
            'appointment' => $billing->appointment ? [
                'id' => $billing->appointment->id,
                'appointment_number' => $billing->appointment->appointment_number,
            ] : null,
            'consultation' => $billing->consultation ? [
                'id' => $billing->consultation->id,
                'consultation_number' => $billing->consultation->consultation_number,
                'diagnosis' => $billing->consultation->diagnosis,
            ] : null,
            'created_by' => $billing->creator?->name,
            'cancelled_remarks' => $billing->cancelled_remarks,
            'cancelled_at' => $billing->cancelled_at?->toIso8601String(),
            'items' => $billing->items->map(fn (BillingItem $item): array => [
                'id' => $item->id,
                'service_id' => $item->service_id,
                'item_type' => $item->item_type,
                'description' => $item->description,
                'quantity' => (float) $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total_price' => (float) $item->total_price,
            ])->values(),
            'payments' => $billing->payments->sortByDesc('payment_date')->map(fn (Payment $payment): array => [
                'id' => $payment->id,
                'payment_reference' => $payment->payment_reference,
                'payment_method' => $payment->payment_method,
                'amount_paid' => (float) $payment->amount_paid,
                'change_amount' => (float) $payment->change_amount,
                'payment_date' => $payment->payment_date?->toIso8601String(),
                'received_by' => $payment->receiver?->name,
                'remarks' => $payment->remarks,
            ])->values(),
        ];
    }

    /** @return Collection<int, array<string, mixed>> */
    public function historyForPatient(Patient $patient): Collection
    {
        return Billing::query()
            ->whereBelongsTo($patient)
            ->withSum('payments', 'amount_paid')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (Billing $billing): array => $this->summary($billing));
    }

    /** @return array<string, mixed> */
    private function summary(Billing $billing): array
    {
        $billing->loadMissing('patient:id,patient_code,first_name,middle_name,last_name,suffix');

        $paidAmount = (float) ($billing->payments_sum_amount_paid ?? $billing->payments->sum('amount_paid'));

        return [
            'id' => $billing->id,
            'invoice_number' => $billing->invoice_number,
            'patient_id' => $billing->patient_id,
            'appointment_id' => $billing->appointment_id,
            'consultation_id' => $billing->consultation_id,
            'total_amount' => (float) $billing->total_amount,
            'discount' => (float) $billing->discount,
            'tax' => (float) $billing->tax,
            'grand_total' => (float) $billing->grand_total,
            'amount_paid' => $paidAmount,
            'balance_due' => max((float) $billing->grand_total - $paidAmount, 0),
            'payment_status' => $billing->payment_status,
            'created_at' => $billing->created_at?->toIso8601String(),
            'updated_at' => $billing->updated_at?->toIso8601String(),
            'patient' => [
                'id' => $billing->patient->id,
                'patient_code' => $billing->patient->patient_code,
                'full_name' => $billing->patient->full_name,
            ],
        ];
    }

    /** @param list<array<string, mixed>> $items */
    private function replaceItems(Billing $billing, array $items): void
    {
        $billing->items()->delete();
        $services = Service::query()
            ->whereIn('id', collect($items)->pluck('service_id')->filter()->unique()->values())
            ->get()
            ->keyBy('id');

        $billing->items()->createMany(collect($items)->map(function (array $item) use ($services): array {
            $quantity = round((float) $item['quantity'], 2);
            $service = filled($item['service_id'] ?? null) ? $services->get((int) $item['service_id']) : null;
            $unitPrice = round((float) ($service?->price ?? $item['unit_price']), 2);

            return [
                'service_id' => $service?->id,
                'item_type' => $service?->category ?? $item['item_type'],
                'description' => $service?->name ?? $item['description'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => round($quantity * $unitPrice, 2),
            ];
        })->all());
    }

    private function recalculateTotals(Billing $billing): void
    {
        $totalAmount = round((float) $billing->items()->sum('total_price'), 2);
        $discount = round((float) $billing->discount, 2);
        $tax = round((float) $billing->tax, 2);

        $billing->forceFill([
            'total_amount' => $totalAmount,
            'grand_total' => max(round($totalAmount - $discount + $tax, 2), 0),
        ])->save();

        $this->updatePaymentStatus($billing);
    }

    private function updatePaymentStatus(Billing $billing): void
    {
        if ($billing->payment_status === Billing::STATUS_CANCELLED) {
            return;
        }

        $paidAmount = round((float) $billing->payments()->sum('amount_paid'), 2);
        $grandTotal = round((float) $billing->grand_total, 2);

        $status = match (true) {
            $paidAmount <= 0 => Billing::STATUS_UNPAID,
            $paidAmount >= $grandTotal => Billing::STATUS_PAID,
            default => Billing::STATUS_PARTIALLY_PAID,
        };

        $billing->forceFill(['payment_status' => $status])->save();
    }

    private function balanceDue(Billing $billing): float
    {
        return max(round((float) $billing->grand_total - (float) $billing->payments()->sum('amount_paid'), 2), 0);
    }

    /** @param array<string, mixed> $data */
    private function createWithUniqueNumber(array $data): Billing
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return Billing::create([...$data, 'invoice_number' => $this->generateInvoiceNumber()]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return Billing::create([...$data, 'invoice_number' => $this->generateInvoiceNumber()]);
    }

    /** @param array<string, mixed> $data */
    private function createPaymentWithUniqueReference(array $data): Payment
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return Payment::create([...$data, 'payment_reference' => $this->generatePaymentReference()]);
            } catch (QueryException $exception) {
                if ((string) $exception->getCode() !== '23000') {
                    throw $exception;
                }
            }
        }

        return Payment::create([...$data, 'payment_reference' => $this->generatePaymentReference()]);
    }

    private function generateInvoiceNumber(): string
    {
        do {
            $number = 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Billing::query()->where('invoice_number', $number)->exists());

        return $number;
    }

    private function generatePaymentReference(): string
    {
        do {
            $reference = 'PAY-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Payment::query()->where('payment_reference', $reference)->exists());

        return $reference;
    }

    /** @return Collection<int, array{id: int, full_name: string, patient_code: string}> */
    private function patientOptions(): Collection
    {
        return Patient::query()
            ->where('status', 'active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'patient_code', 'first_name', 'middle_name', 'last_name', 'suffix'])
            ->map(fn (Patient $patient): array => [
                'id' => $patient->id,
                'full_name' => $patient->full_name,
                'patient_code' => $patient->patient_code,
            ]);
    }
}
