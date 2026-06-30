import PrescriptionController from '@/actions/App/Http/Controllers/PrescriptionController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Clock3 } from 'lucide-react';
import { PrescriptionList } from './prescription-list';
import { PaginatedPrescriptions } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Prescriptions', href: PrescriptionController.index().url },
];

export default function PrescriptionsIndex({
    prescriptions,
    filters,
}: {
    prescriptions: PaginatedPrescriptions;
    filters: { search?: string; status?: string };
}) {
    const permissions = new Set(
        usePage<SharedData>().props.auth.permissions ?? [],
    );
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Prescriptions" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Prescriptions
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Prescription history available to your role.
                        </p>
                    </div>
                    {permissions.has('prescriptions.dispense') && (
                        <Button asChild>
                            <Link href={PrescriptionController.pending().url}>
                                <Clock3 />
                                Pending prescriptions
                            </Link>
                        </Button>
                    )}
                </div>
                <PrescriptionList
                    prescriptions={prescriptions}
                    filters={filters}
                />
            </div>
        </AppLayout>
    );
}
