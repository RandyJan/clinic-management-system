import QueueController from '@/actions/App/Http/Controllers/QueueController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { CheckCircle2, Clock4, Megaphone, RotateCcw, SkipForward, Stethoscope } from 'lucide-react';
import { QueueItem, QueueStatus } from './types';

const statusClasses: Record<QueueStatus, string> = {
    Waiting: 'bg-slate-600 text-white hover:bg-slate-600',
    Called: 'bg-amber-600 text-white hover:bg-amber-600',
    'In Consultation': 'bg-blue-600 text-white hover:bg-blue-600',
    Completed: 'bg-emerald-600 text-white hover:bg-emerald-600',
    Skipped: 'bg-zinc-500 text-white hover:bg-zinc-500',
    Cancelled: 'bg-red-600 text-white hover:bg-red-600',
};

export function QueueStatusBadge({ status }: { status: QueueStatus }) {
    return <Badge className={statusClasses[status]}>{status}</Badge>;
}

export function QueueTable({
    queues,
    actions = true,
}: {
    queues: QueueItem[];
    actions?: boolean;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Queue</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Checked in</TableHead>
                        {actions && (
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {queues.map((queue) => (
                        <TableRow key={queue.id}>
                            <TableCell className="text-lg font-semibold">
                                {queue.queue_number}
                                {queue.appointment_number && (
                                    <div className="text-sm font-normal text-muted-foreground">
                                        {queue.appointment_number}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="min-w-56">
                                <div className="font-medium">
                                    {queue.patient.full_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {queue.patient.patient_code}
                                </div>
                            </TableCell>
                            <TableCell className="min-w-48">
                                <div>{queue.doctor.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {queue.doctor.specialization}
                                </div>
                            </TableCell>
                            <TableCell>
                                <QueueStatusBadge status={queue.status} />
                            </TableCell>
                            <TableCell>{formatTime(queue.checked_in_at)}</TableCell>
                            {actions && (
                                <TableCell>
                                    <QueueActions queue={queue} />
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {queues.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={actions ? 6 : 5}
                                className="h-24 text-center text-muted-foreground"
                            >
                                No queue records found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export function QueueActions({ queue }: { queue: QueueItem }) {
    function patch(url: string) {
        router.patch(url, {}, { preserveScroll: true });
    }

    return (
        <div className="flex flex-wrap justify-end gap-2">
            {queue.status === 'Waiting' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => patch(QueueController.recall(queue.id).url)}
                >
                    <Megaphone />
                    Call
                </Button>
            )}
            {queue.status === 'Skipped' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => patch(QueueController.recall(queue.id).url)}
                >
                    <RotateCcw />
                    Recall
                </Button>
            )}
            {queue.status === 'Called' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => patch(QueueController.start(queue.id).url)}
                >
                    <Stethoscope />
                    Start
                </Button>
            )}
            {queue.status !== 'Completed' && queue.status !== 'Cancelled' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => patch(QueueController.skip(queue.id).url)}
                >
                    <SkipForward />
                    Skip
                </Button>
            )}
            {queue.status === 'In Consultation' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => patch(QueueController.complete(queue.id).url)}
                >
                    <CheckCircle2 />
                    Complete
                </Button>
            )}
        </div>
    );
}

export function ActiveQueuePanels({ queues }: { queues: QueueItem[] }) {
    const called = queues.filter((queue) => queue.status === 'Called');
    const waiting = queues.filter((queue) => queue.status === 'Waiting');
    const skipped = queues.filter((queue) => queue.status === 'Skipped');

    return (
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr_1fr]">
            <QueuePanel title="Now calling" queues={called} emphasis />
            <QueuePanel title="Waiting" queues={waiting} />
            <QueuePanel title="Skipped" queues={skipped} />
        </div>
    );
}

function QueuePanel({
    title,
    queues,
    emphasis = false,
}: {
    title: string;
    queues: QueueItem[];
    emphasis?: boolean;
}) {
    return (
        <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{title}</h2>
                <Badge variant="outline">{queues.length}</Badge>
            </div>
            <div className="grid gap-2">
                {queues.slice(0, 6).map((queue) => (
                    <div
                        key={queue.id}
                        className={
                            emphasis
                                ? 'rounded-md border bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100'
                                : 'rounded-md border p-3'
                        }
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xl font-semibold">
                                {queue.queue_number}
                            </span>
                            <QueueStatusBadge status={queue.status} />
                        </div>
                        <div className="mt-1 text-sm">
                            {queue.patient.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {queue.doctor.full_name}
                        </div>
                    </div>
                ))}
                {queues.length === 0 && (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No patients.
                    </div>
                )}
            </div>
        </section>
    );
}

export function formatTime(value: string | null) {
    if (!value) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        timeStyle: 'short',
    }).format(new Date(value));
}

export function formatDate(value: string | null | undefined) {
    if (!value) {
        return 'Today';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(`${value}T00:00:00`));
}

export function EmptyClock() {
    return (
        <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            <Clock4 className="size-4" />
            Waiting for queue updates.
        </div>
    );
}
