import MedicalCertificateController from '@/actions/App/Http/Controllers/MedicalCertificateController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { MedicalCertificate } from './types';

export default function MedicalCertificateShow({
    certificate,
}: {
    certificate: MedicalCertificate;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Medical Certificate',
            href: MedicalCertificateController.show(certificate.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={certificate.certificate_number} />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {certificate.certificate_number}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {certificate.patient.full_name} · Issued{' '}
                            {certificate.issued_date}
                        </p>
                    </div>
                    <Button asChild>
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
                <CertificateBody certificate={certificate} />
            </div>
        </AppLayout>
    );
}

export function CertificateBody({
    certificate,
}: {
    certificate: MedicalCertificate;
}) {
    return (
        <div className="grid gap-4 rounded-lg border border-sidebar-border/70 p-6 dark:border-sidebar-border">
            <div className="grid gap-3 md:grid-cols-3">
                <Detail label="Patient" value={certificate.patient.full_name} />
                <Detail
                    label="Patient code"
                    value={certificate.patient.patient_code}
                />
                <Detail label="Age" value={certificate.patient.age?.toString() ?? 'N/A'} />
                <Detail
                    label="Consultation"
                    value={certificate.consultation.consultation_number}
                />
                <Detail label="Doctor" value={`Dr. ${certificate.doctor.full_name}`} />
                <Detail label="Issued date" value={certificate.issued_date} />
            </div>
            <Detail label="Diagnosis" value={certificate.diagnosis} />
            <Detail label="Recommendation" value={certificate.recommendation} />
            <Detail
                label="Rest days"
                value={
                    certificate.rest_days === null
                        ? 'Not specified'
                        : `${certificate.rest_days} day(s)`
                }
            />
            <Detail label="Remarks" value={certificate.remarks ?? 'None'} />
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1">
            <div className="text-xs font-medium text-muted-foreground">
                {label}
            </div>
            <div className="min-w-0 text-sm break-words">{value}</div>
        </div>
    );
}
