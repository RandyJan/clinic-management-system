<?php

namespace App\Http\Controllers;

use App\Http\Requests\ServiceIndexRequest;
use App\Http\Requests\StoreServiceRequest;
use App\Models\Service;
use App\Services\ServiceCatalogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function __construct(private readonly ServiceCatalogService $service) {}

    public function index(ServiceIndexRequest $request): Response
    {
        $filters = $request->safe()->only(['search', 'category', 'status']);

        return Inertia::render('services/index', [
            'services' => $this->service->list($filters, (int) $request->input('per_page', 15)),
            'filters' => $filters,
            'categories' => Service::CATEGORIES,
            'statuses' => Service::STATUSES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('services/create', [
            'categories' => Service::CATEGORIES,
            'statuses' => Service::STATUSES,
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $service = $this->service->create($request->validated(), $request->user());

        return redirect()
            ->route('services.edit', $service)
            ->with('success', 'Clinic service created.');
    }

    public function edit(Service $service): Response
    {
        return Inertia::render('services/edit', [
            'service' => $this->service->detail($service),
            'categories' => Service::CATEGORIES,
            'statuses' => Service::STATUSES,
        ]);
    }

    public function update(StoreServiceRequest $request, Service $service): RedirectResponse
    {
        $this->service->update($service, $request->validated(), $request->user());

        return redirect()
            ->route('services.edit', $service)
            ->with('success', 'Clinic service updated.');
    }
}
