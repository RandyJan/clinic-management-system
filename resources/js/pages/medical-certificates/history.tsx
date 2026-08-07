import MedicalCertificateController from '@/actions/App/Http/Controllers/MedicalCertificateController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { MedicalCertificateHistoryItem } from './types';

export default function MedicalCertificateHistory({
    patient,
    certificates,
}: {
    patient: { id: number; patient_code: string; full_name: string };
    certificates: MedicalCertificateHistoryItem[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Certificate History',
            href: MedicalCertificateController.patient(patient.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Certificate history" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Certificate history
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {patient.full_name} · {patient.patient_code}
                    </p>
                </div>
                <div className="grid gap-3">
                    {certificates.map((certificate) => (
                        <div
                            key={certificate.id}
                            className="grid gap-2 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="font-medium">
                                        {certificate.certificate_number}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {certificate.issued_date} · Dr.{' '}
                                        {certificate.doctor.full_name}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link
                                            href={
                                                MedicalCertificateController.show(
                                                    certificate.id,
                                                ).url
                                            }
                                        >
                                            Details
                                        </Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link
                                            href={
                                                MedicalCertificateController.print(
                                                    certificate.id,
                                                ).url
                                            }
                                        >
                                            <Printer />
                                            Print
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {certificate.diagnosis}
                            </p>
                        </div>
                    ))}
                    {certificates.length === 0 && (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No certificates recorded.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
