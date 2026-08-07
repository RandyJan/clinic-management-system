<?php

namespace App\Http\Controllers;

use App\Http\Requests\MedicineIndexRequest;
use App\Http\Requests\StockAdjustmentRequest;
use App\Http\Requests\StoreMedicineRequest;
use App\Models\Medicine;
use App\Models\StockTransaction;
use App\Services\MedicineInventoryService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MedicineController extends Controller
{
    public function __construct(private readonly MedicineInventoryService $service) {}

    public function index(MedicineIndexRequest $request): Response
    {
        $filters = $request->safe()->only(['search', 'category', 'status']);

        return Inertia::render('medicines/index', [
            'medicines' => $this->service->list($filters, (int) $request->input('per_page', 15)),
            'filters' => $filters,
            'categories' => $this->service->categories(),
            'statuses' => Medicine::STATUSES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('medicines/create', [
            'categories' => $this->service->categories(),
            'dosage_forms' => Medicine::DOSAGE_FORMS,
            'statuses' => Medicine::STATUSES,
        ]);
    }

    public function store(StoreMedicineRequest $request): RedirectResponse
    {
        $medicine = $this->service->create($request->validated(), $request->user());

        return redirect()
            ->route('medicines.edit', $medicine)
            ->with('success', 'Medicine added.');
    }

    public function edit(Medicine $medicine): Response
    {
        return Inertia::render('medicines/edit', [
            'medicine' => $this->service->detail($medicine),
            'categories' => $this->service->categories(),
            'dosage_forms' => Medicine::DOSAGE_FORMS,
            'statuses' => Medicine::STATUSES,
        ]);
    }

    public function update(StoreMedicineRequest $request, Medicine $medicine): RedirectResponse
    {
        $this->service->update($medicine, $request->validated(), $request->user());

        return redirect()
            ->route('medicines.edit', $medicine)
            ->with('success', 'Medicine updated.');
    }

    public function stock(Medicine $medicine): Response
    {
        return Inertia::render('medicines/stock', [
            'medicine' => $this->service->detail($medicine),
            'transaction_types' => [
                StockTransaction::TYPE_STOCK_IN,
                StockTransaction::TYPE_STOCK_OUT,
                StockTransaction::TYPE_ADJUSTMENT,
                StockTransaction::TYPE_RETURNED,
                StockTransaction::TYPE_EXPIRED,
            ],
        ]);
    }

    public function updateStock(StockAdjustmentRequest $request, Medicine $medicine): RedirectResponse
    {
        $this->service->adjustStock($medicine, $request->validated(), $request->user());

        return redirect()
            ->route('medicines.transactions', $medicine)
            ->with('success', 'Stock updated.');
    }

    public function transactions(MedicineIndexRequest $request, Medicine $medicine): Response
    {
        return Inertia::render('medicines/transactions', [
            'medicine' => $this->service->detail($medicine),
            'transactions' => $this->service->transactions($medicine, (int) $request->input('per_page', 15)),
        ]);
    }

    public function lowStock(MedicineIndexRequest $request): Response
    {
        return Inertia::render('medicines/low-stock', [
            'medicines' => $this->service->lowStock((int) $request->input('per_page', 15)),
        ]);
    }

    public function expiry(MedicineIndexRequest $request): Response
    {
        $status = $request->validated('expiry_status', 'near-expiry');

        return Inertia::render('medicines/expiry', [
            'medicines' => $this->service->expiryReport($status, (int) $request->input('per_page', 15)),
            'expiry_status' => $status,
        ]);
    }
}
