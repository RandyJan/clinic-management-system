import { Head, usePoll } from '@inertiajs/react';
import { QueueStatusBadge, formatTime } from './partials';
import { QueueItem } from './types';

export default function QueueDisplay({ queues }: { queues: QueueItem[] }) {
    usePoll(3000, { only: ['queues'] }, { keepAlive: true });

    const called = queues.filter((queue) => queue.status === 'Called');
    const inConsultation = queues.filter(
        (queue) => queue.status === 'In Consultation',
    );
    const waiting = queues.filter((queue) => queue.status === 'Waiting');

    return (
        <>
            <Head title="Queue Display" />
            <main className="min-h-screen bg-background p-6 text-foreground">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <header className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-4xl font-semibold">
                                Clinic Queue
                            </h1>
                            <p className="text-muted-foreground">
                                {new Intl.DateTimeFormat(undefined, {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                }).format(new Date())}
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Updates every few seconds
                        </div>
                    </header>

                    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="grid gap-4 rounded-lg border p-5">
                            <h2 className="text-2xl font-semibold">
                                Now Calling
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {called.slice(0, 4).map((queue) => (
                                    <QueueDisplayCard
                                        key={queue.id}
                                        queue={queue}
                                        large
                                    />
                                ))}
                                {called.length === 0 && (
                                    <EmptyDisplay text="No patients are being called." />
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 rounded-lg border p-5">
                            <h2 className="text-2xl font-semibold">
                                In Consultation
                            </h2>
                            <div className="grid gap-3">
                                {inConsultation.slice(0, 5).map((queue) => (
                                    <QueueDisplayCard
                                        key={queue.id}
                                        queue={queue}
                                    />
                                ))}
                                {inConsultation.length === 0 && (
                                    <EmptyDisplay text="No active consultations." />
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 rounded-lg border p-5">
                        <h2 className="text-2xl font-semibold">Waiting</h2>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {waiting.slice(0, 12).map((queue) => (
                                <QueueDisplayCard key={queue.id} queue={queue} />
                            ))}
                            {waiting.length === 0 && (
                                <EmptyDisplay text="No waiting patients." />
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}

function QueueDisplayCard({
    queue,
    large = false,
}: {
    queue: QueueItem;
    large?: boolean;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div
                        className={
                            large
                                ? 'text-6xl font-semibold leading-none'
                                : 'text-3xl font-semibold leading-none'
                        }
                    >
                        {queue.queue_number}
                    </div>
                    <div className="mt-3 text-lg font-medium">
                        {queue.patient.full_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {queue.doctor.full_name}
                    </div>
                </div>
                <QueueStatusBadge status={queue.status} />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
                Checked in {formatTime(queue.checked_in_at)}
            </div>
        </div>
    );
}

function EmptyDisplay({ text }: { text: string }) {
    return (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            {text}
        </div>
    );
}

