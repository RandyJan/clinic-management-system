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
import { result as labResult } from '@/routes/laboratory-requests';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    EmptyState,
    formatDate,
    PortalHeader,
    PortalPagination,
    StatusBadge,
} from './partials';
import { PortalLabResultsProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patient Portal', href: PatientPortalController.dashboard().url },
    { title: 'My Lab Results', href: PatientPortalController.labResults().url },
];

export default function PatientPortalLabResults({
    laboratory_requests,
}: PortalLabResultsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Lab Results" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <PortalHeader
                    title="My lab results"
                    description={`${laboratory_requests.total} laboratory request records`}
                />

                {laboratory_requests.data.length === 0 ? (
                    <EmptyState description="No laboratory requests or results are available yet." />
                ) : (
                    <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request</TableHead>
                                    <TableHead>Tests</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Requested</TableHead>
                                    <TableHead className="text-right">
                                        Result
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {laboratory_requests.data.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">
                                            {request.lab_request_number}
                                        </TableCell>
                                        <TableCell className="min-w-64">
                                            {request.requested_tests.join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            {request.doctor.full_name}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={request.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(request.requested_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {request.has_result ? (
                                                <Link
                                                    href={
                                                        labResult(request.id)
                                                            .url
                                                    }
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    View result
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    Pending
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <PortalPagination pagination={laboratory_requests} />
            </div>
        </AppLayout>
    );
}
