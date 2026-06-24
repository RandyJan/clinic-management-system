import QueueController from '@/actions/App/Http/Controllers/QueueController';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    create as queueCreate,
    display as queueDisplay,
    index as queuesIndex,
} from '@/routes/queues';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePoll } from '@inertiajs/react';
import { LogIn, Megaphone, Monitor, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { ActiveQueuePanels, QueueTable, formatDate } from './partials';
import { DoctorOption, PaginatedQueues, QueueItem } from './types';

type Filters = {
    search?: string;
    status?: string;
    doctor_id?: string;
    queue_date?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Queue', href: queuesIndex().url },
];

export default function QueueIndex({
    queues,
    active_queues,
    doctors,
    filters,
}: {
    queues: PaginatedQueues;
    active_queues: QueueItem[];
    doctors: DoctorOption[];
    filters: Filters;
}) {
    usePoll(3000, { only: ['queues', 'active_queues'] });

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [doctorId, setDoctorId] = useState(
        filters.doctor_id?.toString() ?? 'all',
    );
    const [queueDate, setQueueDate] = useState(
        filters.queue_date ?? new Date().toISOString().slice(0, 10),
    );

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            queuesIndex().url,
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
                doctor_id: doctorId === 'all' ? undefined : doctorId,
                queue_date: queueDate || undefined,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function callNext() {
        router.patch(QueueController.callNext().url, {}, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Queue" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Queue - {formatDate(queueDate)}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {active_queues.length} active queue items
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={callNext}>
                            <Megaphone />
                            Call next
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={queueDisplay().url}>
                                <Monitor />
                                Display
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={queueCreate().url}>
                                <LogIn />
                                Check in
                            </Link>
                        </Button>
                    </div>
                </div>

                <form
                    onSubmit={submitFilters}
                    className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 md:grid-cols-2 xl:grid-cols-5 dark:border-sidebar-border"
                >
                    <div className="grid gap-1">
                        <Label htmlFor="queue-search">Search</Label>
                        <Input
                            id="queue-search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Queue, patient, doctor"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={queueDate}
                            onChange={(event) =>
                                setQueueDate(event.target.value)
                            }
                        />
                    </div>
                    <FilterSelect
                        label="Doctor"
                        value={doctorId}
                        onChange={setDoctorId}
                        options={doctors.map((doctor) => [
                            doctor.id.toString(),
                            doctor.full_name,
                        ])}
                    />
                    <FilterSelect
                        label="Status"
                        value={status}
                        onChange={setStatus}
                        options={[
                            ['Waiting', 'Waiting'],
                            ['Called', 'Called'],
                            ['In Consultation', 'In Consultation'],
                            ['Completed', 'Completed'],
                            ['Skipped', 'Skipped'],
                            ['Cancelled', 'Cancelled'],
                        ]}
                    />
                    <div className="flex items-end">
                        <Button type="submit" className="w-full">
                            <Search />
                            Search
                        </Button>
                    </div>
                </form>

                <ActiveQueuePanels queues={active_queues} />
                <QueueTable queues={queues.data} />
                <QueuePagination queues={queues} />
            </div>
        </AppLayout>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: [string, string][];
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-1">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {options.map(([optionValue, text]) => (
                        <SelectItem key={optionValue} value={optionValue}>
                            {text}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function QueuePagination({ queues }: { queues: PaginatedQueues }) {
    if (queues.links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {queues.from ?? 0} to {queues.to ?? 0} of {queues.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                {queues.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            className={cn(
                                buttonVariants({
                                    variant: link.active
                                        ? 'default'
                                        : 'outline',
                                    size: 'sm',
                                }),
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={`${link.label}-${index}`}
                            className={cn(
                                buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                }),
                                'pointer-events-none opacity-50',
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </div>
    );
}
