<?php

namespace App\Http\Controllers;

use App\Http\Requests\MedicalRecordIndexRequest;
use App\Models\Patient;
use App\Services\MedicalRecordPdfService;
use App\Services\MedicalRecordService;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MedicalRecordController extends Controller
{
    public function __construct(
        private readonly MedicalRecordService $service,
        private readonly MedicalRecordPdfService $pdfService,
    ) {}

    public function index(MedicalRecordIndexRequest $request): Response
    {
        $filters = $request->safe()->only(['search']);

        return Inertia::render('medical-records/index', [
            'records' => $this->service->list($request->user(), $filters, (int) $request->input('per_page', 15)),
            'filters' => $filters,
        ]);
    }

    public function show(Patient $patient): Response
    {
        Gate::authorize('viewMedicalRecord', $patient);

        return Inertia::render('medical-records/show', ['record' => $this->service->record($patient)]);
    }

    public function print(Patient $patient): Response
    {
        Gate::authorize('viewMedicalRecord', $patient);

        return Inertia::render('medical-records/print', ['record' => $this->service->record($patient)]);
    }

    public function export(Patient $patient): HttpResponse
    {
        Gate::authorize('viewMedicalRecord', $patient);

        $record = $this->service->record($patient);
        $filename = "medical-record-{$patient->patient_code}.pdf";

        return response($this->pdfService->render($record), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
