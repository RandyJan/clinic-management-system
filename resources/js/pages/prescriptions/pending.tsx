import PrescriptionController from '@/actions/App/Http/Controllers/PrescriptionController';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PrescriptionList } from './prescription-list';
import { PaginatedPrescriptions } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Prescriptions', href: PrescriptionController.index().url },
    { title: 'Pending', href: PrescriptionController.pending().url },
];

export default function PendingPrescriptions({
    prescriptions,
    filters,
}: {
    prescriptions: PaginatedPrescriptions;
    filters: { search?: string };
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pending prescriptions" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Pending prescriptions
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Review prescriptions ready for pharmacy dispensing.
                    </p>
                </div>
                <PrescriptionList
                    prescriptions={prescriptions}
                    filters={filters}
                    pendingOnly
                />
            </div>
        </AppLayout>
    );
}
