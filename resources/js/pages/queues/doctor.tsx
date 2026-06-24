import QueueController from '@/actions/App/Http/Controllers/QueueController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { doctor as doctorQueue } from '@/routes/queues';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePoll } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import { ActiveQueuePanels, QueueTable } from './partials';
import { DoctorOption, QueueItem } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctor Queue', href: doctorQueue().url },
];

export default function DoctorQueue({
    doctor,
    queues,
}: {
    doctor: DoctorOption | null;
    queues: QueueItem[];
}) {
    usePoll(3000, { only: ['queues'] });

    function callNext() {
        router.patch(QueueController.callNext().url, {}, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Doctor Queue" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Doctor Queue
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {doctor
                                ? `${doctor.full_name} - ${doctor.specialization}`
                                : 'Active queue'}
                        </p>
                    </div>
                    <Button onClick={callNext}>
                        <Megaphone />
                        Call next patient
                    </Button>
                </div>

                <ActiveQueuePanels queues={queues} />
                <QueueTable queues={queues} />
            </div>
        </AppLayout>
    );
}
