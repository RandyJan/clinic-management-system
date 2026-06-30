import LaboratoryRequestController from '@/actions/App/Http/Controllers/LaboratoryRequestController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Download, FilePenLine } from 'lucide-react';
import { formatDate, StatusBadge } from './index';
import { LabRequestDetail } from './types';

export default function LaboratoryResultView({
    laboratory_request,
}: {
    laboratory_request: LabRequestDetail;
}) {
    const permissions = new Set(
        usePage<SharedData>().props.auth.permissions ?? [],
    );
    const result = laboratory_request.result;
    if (!result) return null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Laboratory', href: LaboratoryRequestController.index().url },
        {
            title: laboratory_request.lab_request_number,
            href: LaboratoryRequestController.show(laboratory_request.id).url,
        },
        {
            title: 'Result',
            href: LaboratoryRequestController.result(laboratory_request.id).url,
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${laboratory_request.lab_request_number} result`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold">
                                Laboratory result
                            </h1>
                            <StatusBadge status={laboratory_request.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {laboratory_request.lab_request_number} · Uploaded{' '}
                            {formatDate(result.uploaded_at)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {permissions.has(
                            'laboratory-requests.upload-results',
                        ) && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={
                                        LaboratoryRequestController.upload(
                                            laboratory_request.id,
                                        ).url
                                    }
                                >
                                    <FilePenLine />
                                    Update result
                                </Link>
                            </Button>
                        )}
                        {result.has_attachment && (
                            <Button asChild>
                                <a
                                    href={
                                        LaboratoryRequestController.attachment(
                                            laboratory_request.id,
                                        ).url
                                    }
                                >
                                    <Download />
                                    Download attachment
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Info
                        title="Patient"
                        lines={[
                            laboratory_request.patient.full_name,
                            laboratory_request.patient.patient_code,
                        ]}
                    />
                    <Info
                        title="Request"
                        lines={[
                            laboratory_request.requested_tests.join(', '),
                            `Dr. ${laboratory_request.doctor.full_name}`,
                        ]}
                    />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Result details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-6 whitespace-pre-wrap">
                            {result.result_details}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Remarks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                            {result.remarks || 'No remarks recorded.'}
                        </p>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Uploaded by{' '}
                            {result.uploaded_by ?? 'Authorized staff'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function Info({ title, lines }: { title: string; lines: string[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
                {lines.map((line, index) => (
                    <p
                        key={line}
                        className={
                            index === 0
                                ? 'font-medium'
                                : 'text-muted-foreground'
                        }
                    >
                        {line}
                    </p>
                ))}
            </CardContent>
        </Card>
    );
}
