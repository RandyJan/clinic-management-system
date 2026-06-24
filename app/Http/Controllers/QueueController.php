<?php

namespace App\Http\Controllers;

use App\Http\Requests\QueueIndexRequest;
use App\Http\Requests\StoreQueueCheckInRequest;
use App\Http\Requests\UpdateQueueStatusRequest;
use App\Models\ClinicQueue;
use App\Models\Doctor;
use App\Services\QueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class QueueController extends Controller
{
    public function __construct(private readonly QueueService $service) {}

    public function index(QueueIndexRequest $request): Response
    {
        $perPage = (int) $request->input('per_page', 15);
        $filters = $request->safe()->only(['search', 'status', 'doctor_id', 'queue_date']);

        return Inertia::render('queues/index', [
            'queues' => $this->service->list($filters, $perPage),
            'active_queues' => $this->service->activeList($filters),
            'doctors' => $this->service->activeDoctors(),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('queues/check-in', [
            'patients' => $this->service->activePatients(),
            'doctors' => $this->service->activeDoctors(),
        ]);
    }

    public function store(StoreQueueCheckInRequest $request): RedirectResponse
    {
        $queue = $this->service->checkIn($request->validated(), $request->user());

        return redirect()
            ->route('queues.index', ['queue_date' => $queue->queue_date?->toDateString()])
            ->with('success', "Checked in patient as {$queue->queue_number}.");
    }

    public function doctor(): Response
    {
        $doctor = Doctor::query()->where('user_id', request()->user()?->id)->first();

        abort_unless($doctor !== null || request()->user()?->can('queues.view'), 403);

        return Inertia::render('queues/doctor', [
            'doctor' => $doctor ? [
                'id' => $doctor->id,
                'full_name' => $doctor->full_name,
                'specialization' => $doctor->specialization,
            ] : null,
            'queues' => $this->service->activeList([
                'doctor_id' => $doctor?->id,
                'queue_date' => now()->toDateString(),
            ]),
        ]);
    }

    public function callNext(UpdateQueueStatusRequest $request): RedirectResponse
    {
        $doctor = Doctor::query()->where('user_id', $request->user()?->id)->first();
        $queue = $this->service->callNext($request->user(), $doctor);

        return back()->with('success', "Called {$queue->queue_number}.");
    }

    public function recall(UpdateQueueStatusRequest $request, ClinicQueue $queue): RedirectResponse
    {
        $this->authorizeQueueAction($queue);
        $queue = $this->service->recall($queue, $request->user());

        return back()->with('success', "Recalled {$queue->queue_number}.");
    }

    public function start(UpdateQueueStatusRequest $request, ClinicQueue $queue): RedirectResponse
    {
        $this->authorizeQueueAction($queue);
        $queue = $this->service->startConsultation($queue, $request->user());

        return back()->with('success', "Started consultation for {$queue->queue_number}.");
    }

    public function skip(UpdateQueueStatusRequest $request, ClinicQueue $queue): RedirectResponse
    {
        $this->authorizeQueueAction($queue);
        $queue = $this->service->skip($queue, $request->user());

        return back()->with('success', "Skipped {$queue->queue_number}.");
    }

    public function complete(UpdateQueueStatusRequest $request, ClinicQueue $queue): RedirectResponse
    {
        $this->authorizeQueueAction($queue);
        $queue = $this->service->complete($queue, $request->user());

        return back()->with('success', "Completed {$queue->queue_number}.");
    }

    public function cancel(UpdateQueueStatusRequest $request, ClinicQueue $queue): RedirectResponse
    {
        $this->authorizeQueueAction($queue);
        $queue = $this->service->cancel($queue, $request->user());

        return back()->with('success', "Cancelled {$queue->queue_number}.");
    }

    public function display(): Response
    {
        return Inertia::render('queues/display', [
            'queues' => $this->service->activeList(['queue_date' => now()->toDateString()]),
        ]);
    }

    public function snapshot(): JsonResponse
    {
        return response()->json([
            'queues' => $this->service->activeList(['queue_date' => now()->toDateString()]),
        ]);
    }

    private function authorizeQueueAction(ClinicQueue $queue): void
    {
        $user = request()->user();
        $doctor = Doctor::query()->where('user_id', $user?->id)->first();

        abort_unless(
            $user?->can('queues.view') || $doctor?->id === $queue->doctor_id,
            403
        );
    }
}
