import PatientPortalController from '@/actions/App/Http/Controllers/PatientPortalController';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { print as printPrescription } from '@/routes/prescriptions';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import {
    DownloadButton,
    EmptyState,
    formatDate,
    PortalHeader,
    PortalPagination,
    StatusBadge,
} from './partials';
import { PortalPrescriptionsProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patient Portal', href: PatientPortalController.dashboard().url },
    {
        title: 'My Prescriptions',
        href: PatientPortalController.prescriptions().url,
    },
];

export default function PatientPortalPrescriptions({
    prescriptions,
}: PortalPrescriptionsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Prescriptions" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <PortalHeader
                    title="My prescriptions"
                    description={`${prescriptions.total} prescription records`}
                />

                {prescriptions.data.length === 0 ? (
                    <EmptyState description="No prescriptions are available yet." />
                ) : (
                    <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Prescription</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {prescriptions.data.map((prescription) => (
                                    <TableRow key={prescription.id}>
                                        <TableCell className="font-medium">
                                            {prescription.prescription_number}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                {prescription.doctor.full_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {
                                                    prescription.doctor
                                                        .specialization
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {prescription.items_count}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={prescription.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(
                                                prescription.created_at,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DownloadButton
                                                href={
                                                    printPrescription(
                                                        prescription.id,
                                                    ).url
                                                }
                                            >
                                                <Printer />
                                                Print
                                            </DownloadButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <PortalPagination pagination={prescriptions} />
            </div>
        </AppLayout>
    );
}
