import PatientPortalController from '@/actions/App/Http/Controllers/PatientPortalController';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import {
    DownloadButton,
    EmptyState,
    formatDate,
    PortalHeader,
    StatusBadge,
} from './partials';
import { PortalRecordsProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patient Portal', href: PatientPortalController.dashboard().url },
    {
        title: 'My Medical Records',
        href: PatientPortalController.records().url,
    },
];

export default function PatientPortalMedicalRecords({
    patient,
    consultations,
    certificates,
}: PortalRecordsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Medical Records" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <PortalHeader
                    title="My medical records"
                    description={`${patient.patient_code} - ${patient.full_name}`}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Consultation history</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {consultations.length === 0 ? (
                            <EmptyState description="No consultation history is available yet." />
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Consultation</TableHead>
                                            <TableHead>Doctor</TableHead>
                                            <TableHead>Diagnosis</TableHead>
                                            <TableHead>Completed</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {consultations.map((consultation) => (
                                            <TableRow key={consultation.id}>
                                                <TableCell className="font-medium">
                                                    {
                                                        consultation.consultation_number
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        consultation.doctor
                                                            .full_name
                                                    }
                                                </TableCell>
                                                <TableCell className="min-w-64">
                                                    {consultation.diagnosis ??
                                                        'Not recorded'}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        consultation.completed_at,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        status={
                                                            consultation.status
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Medical certificates</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {certificates.length === 0 ? (
                            <EmptyState description="No medical certificates are available yet." />
                        ) : (
                            certificates.map((certificate) => (
                                <div
                                    key={certificate.id}
                                    className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="font-semibold">
                                                {certificate.certificate_number}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Issued{' '}
                                                {formatDate(
                                                    certificate.issued_date,
                                                )}{' '}
                                                by{' '}
                                                {certificate.doctor.full_name}
                                            </p>
                                        </div>
                                        <DownloadButton
                                            href={certificate.print_url}
                                        >
                                            <Download />
                                            Print
                                        </DownloadButton>
                                    </div>
                                    <p className="mt-3 text-sm">
                                        {certificate.recommendation}
                                    </p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
