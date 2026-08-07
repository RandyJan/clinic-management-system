<?php

namespace App\Http\Controllers;

use App\Http\Requests\BillingIndexRequest;
use App\Http\Requests\CancelBillingRequest;
use App\Http\Requests\StoreBillingRequest;
use App\Http\Requests\StorePaymentRequest;
use App\Models\Appointment;
use App\Models\Billing;
use App\Models\Consultation;
use App\Models\Payment;
use App\Services\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __construct(private readonly BillingService $service) {}

    public function index(BillingIndexRequest $request): Response
    {
        $filters = $request->safe()->only(['search', 'status']);

        return Inertia::render('billings/index', [
            'billings' => $this->service->list($filters, (int) $request->input('per_page', 15)),
            'filters' => $filters,
            'statuses' => Billing::STATUSES,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Billing::class);

        return Inertia::render('billings/create', $this->service->createContext());
    }

    public function createFromAppointment(Appointment $appointment): Response
    {
        Gate::authorize('create', Billing::class);

        return Inertia::render('billings/create', $this->service->createContext($appointment));
    }

    public function createFromConsultation(Consultation $consultation): Response
    {
        Gate::authorize('create', Billing::class);

        return Inertia::render('billings/create', $this->service->createContext(consultation: $consultation));
    }

    public function store(StoreBillingRequest $request): RedirectResponse
    {
        $billing = $this->service->create($request->validated(), $request->user());

        return redirect()->route('billings.show', $billing)->with('success', 'Billing invoice created.');
    }

    public function show(Billing $billing): Response
    {
        Gate::authorize('view', $billing);

        return Inertia::render('billings/show', [
            'billing' => $this->service->detail($billing),
            'payment_methods' => Payment::METHODS,
        ]);
    }

    public function edit(Billing $billing): Response
    {
        Gate::authorize('update', $billing);

        return Inertia::render('billings/edit', [
            ...$this->service->createContext(billing: $billing),
            'billing' => $this->service->detail($billing),
        ]);
    }

    public function update(StoreBillingRequest $request, Billing $billing): RedirectResponse
    {
        $billing = $this->service->update($billing, $request->validated(), $request->user());

        return redirect()->route('billings.show', $billing)->with('success', 'Billing invoice updated.');
    }

    public function payment(Billing $billing): Response
    {
        Gate::authorize('recordPayment', $billing);

        return Inertia::render('billings/payment', [
            'billing' => $this->service->detail($billing),
            'payment_methods' => Payment::METHODS,
        ]);
    }

    public function storePayment(StorePaymentRequest $request, Billing $billing): RedirectResponse
    {
        $payment = $this->service->recordPayment($billing, $request->validated(), $request->user());

        return redirect()->route('billings.receipt', [$billing, $payment])->with('success', 'Payment recorded.');
    }

    public function receipt(Billing $billing, Payment $payment): Response
    {
        Gate::authorize('view', $billing);
        abort_unless($payment->billing_id === $billing->id, 404);

        return Inertia::render('billings/receipt', [
            'billing' => $this->service->detail($billing),
            'payment_id' => $payment->id,
        ]);
    }

    public function cancel(CancelBillingRequest $request, Billing $billing): RedirectResponse
    {
        $this->service->cancel($billing, $request->string('remarks')->toString(), $request->user());

        return back()->with('success', 'Billing invoice cancelled.');
    }
}
