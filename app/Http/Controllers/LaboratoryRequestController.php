<?php

namespace App\Http\Controllers;

use App\Http\Requests\LabRequestIndexRequest;
use App\Http\Requests\StoreLabRequestRequest;
use App\Http\Requests\StoreLabResultRequest;
use App\Http\Requests\UpdateLabRequestStatusRequest;
use App\Models\Consultation;
use App\Models\LaboratoryRequest;
use App\Services\LaboratoryRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaboratoryRequestController extends Controller
{
    public function __construct(private readonly LaboratoryRequestService $service) {}

    public function index(LabRequestIndexRequest $request): Response
    {
        $filters = $request->safe()->only(['search', 'status']);

        return Inertia::render('laboratory-requests/index', [
            'laboratory_requests' => $this->service->list($request->user(), $filters, (int) $request->input('per_page', 15)),
            'filters' => $filters,
        ]);
    }

    public function create(Consultation $consultation): Response
    {
        Gate::authorize('createLabRequest', $consultation);

        return Inertia::render('laboratory-requests/create', $this->service->createContext($consultation));
    }

    public function store(StoreLabRequestRequest $request): RedirectResponse
    {
        $laboratoryRequest = $this->service->create($request->validated(), $request->user());

        return redirect()->route('laboratory-requests.show', $laboratoryRequest)->with('success', 'Laboratory request created.');
    }

    public function show(LaboratoryRequest $laboratoryRequest): Response
    {
        Gate::authorize('view', $laboratoryRequest);

        return Inertia::render('laboratory-requests/show', ['laboratory_request' => $this->service->detail($laboratoryRequest)]);
    }

    public function updateStatus(UpdateLabRequestStatusRequest $request, LaboratoryRequest $laboratoryRequest): RedirectResponse
    {
        $this->service->updateStatus($laboratoryRequest, $request->string('status')->toString(), $request->user());

        return back()->with('success', 'Laboratory request status updated.');
    }

    public function upload(LaboratoryRequest $laboratoryRequest): Response
    {
        Gate::authorize('uploadResult', $laboratoryRequest);

        return Inertia::render('laboratory-requests/upload-result', ['laboratory_request' => $this->service->detail($laboratoryRequest)]);
    }

    public function storeResult(StoreLabResultRequest $request, LaboratoryRequest $laboratoryRequest): RedirectResponse
    {
        $this->service->uploadResult(
            $laboratoryRequest,
            $request->safe()->except(['attachment']),
            $request->file('attachment'),
            $request->user()
        );

        return redirect()->route('laboratory-requests.result', $laboratoryRequest)->with('success', 'Laboratory result uploaded.');
    }

    public function result(LaboratoryRequest $laboratoryRequest): Response
    {
        Gate::authorize('view', $laboratoryRequest);
        abort_unless($laboratoryRequest->labResult()->exists(), 404);

        return Inertia::render('laboratory-requests/result', ['laboratory_request' => $this->service->detail($laboratoryRequest)]);
    }

    public function attachment(LaboratoryRequest $laboratoryRequest): StreamedResponse
    {
        Gate::authorize('view', $laboratoryRequest);
        $path = $laboratoryRequest->labResult()->value('attachment_path');
        abort_unless(filled($path) && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->download($path, "{$laboratoryRequest->lab_request_number}-result.".pathinfo($path, PATHINFO_EXTENSION));
    }
}
