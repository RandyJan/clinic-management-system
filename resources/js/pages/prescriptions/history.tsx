import PrescriptionController from '@/actions/App/Http/Controllers/PrescriptionController';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PrescriptionList } from './prescription-list';
import { PaginatedPrescriptions } from './types';

export default function PrescriptionHistory({
    patient,
    prescriptions,
}: {
    patient: { id: number; patient_code: string; full_name: string };
    prescriptions: PaginatedPrescriptions;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Prescriptions', href: PrescriptionController.index().url },
        {
            title: patient.full_name,
            href: PrescriptionController.patient(patient.id).url,
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${patient.full_name} prescriptions`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Patient prescription history
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {patient.full_name} · {patient.patient_code}
                    </p>
                </div>
                <PrescriptionList
                    prescriptions={prescriptions}
                    filters={{}}
                    actionUrl={PrescriptionController.patient(patient.id).url}
                />
            </div>
        </AppLayout>
    );
}
