import LaboratoryRequestController from '@/actions/App/Http/Controllers/LaboratoryRequestController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileUp, FlaskConical, PlayCircle } from 'lucide-react';
import { formatDate, StatusBadge } from './index';
import { LabRequestDetail } from './types';

export default function LaboratoryRequestShow({
    laboratory_request,
}: {
    laboratory_request: LabRequestDetail;
}) {
    const permissions = new Set(
        usePage<SharedData>().props.auth.permissions ?? [],
    );
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Laboratory', href: LaboratoryRequestController.index().url },
        {
            title: laboratory_request.lab_request_number,
            href: LaboratoryRequestController.show(laboratory_request.id).url,
        },
    ];

    function changeStatus(status: string) {
        router.patch(
            LaboratoryRequestController.updateStatus(laboratory_request.id).url,
            { status },
            { preserveScroll: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={laboratory_request.lab_request_number} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-semibold">
                                {laboratory_request.lab_request_number}
                            </h1>
                            <StatusBadge status={laboratory_request.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Requested{' '}
                            {formatDate(laboratory_request.requested_at)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {permissions.has('laboratory-requests.update-status') &&
                            laboratory_request.status !== 'Completed' && (
                                <Select
                                    value={laboratory_request.status}
                                    onValueChange={changeStatus}
                                >
                                    <SelectTrigger className="w-44">
                                        <PlayCircle />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">
                                            Pending
                                        </SelectItem>
                                        <SelectItem value="In Progress">
                                            In Progress
                                        </SelectItem>
                                        <SelectItem value="Cancelled">
                                            Cancelled
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        {laboratory_request.result ? (
                            <Button asChild>
                                <Link
                                    href={
                                        LaboratoryRequestController.result(
                                            laboratory_request.id,
                                        ).url
                                    }
                                >
                                    <FlaskConical />
                                    View result
                                </Link>
                            </Button>
                        ) : permissions.has(
                              'laboratory-requests.upload-results',
                          ) && laboratory_request.status !== 'Cancelled' ? (
                            <Button asChild>
                                <Link
                                    href={
                                        LaboratoryRequestController.upload(
                                            laboratory_request.id,
                                        ).url
                                    }
                                >
                                    <FileUp />
                                    Upload result
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <InfoCard
                        title="Patient"
                        lines={[
                            laboratory_request.patient.full_name,
                            laboratory_request.patient.patient_code,
                            laboratory_request.patient.birthdate ??
                                'Birthdate not recorded',
                            laboratory_request.patient.address,
                        ]}
                    />
                    <InfoCard
                        title="Requesting doctor"
                        lines={[
                            `Dr. ${laboratory_request.doctor.full_name}`,
                            laboratory_request.doctor.specialization,
                            `License: ${laboratory_request.doctor.license_number}`,
                        ]}
                    />
                    <InfoCard
                        title="Consultation"
                        lines={[
                            laboratory_request.consultation.consultation_number,
                            laboratory_request.consultation.diagnosis ??
                                'No diagnosis recorded',
                            laboratory_request.completed_at
                                ? `Completed ${formatDate(laboratory_request.completed_at)}`
                                : 'Awaiting completion',
                        ]}
                    />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Requested tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="grid gap-3 sm:grid-cols-2">
                            {laboratory_request.requested_tests.map(
                                (test, index) => (
                                    <li
                                        key={`${test}-${index}`}
                                        className="rounded-lg border p-3 text-sm"
                                    >
                                        <span className="mr-2 font-semibold">
                                            {index + 1}.
                                        </span>
                                        {test}
                                    </li>
                                ),
                            )}
                        </ol>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Clinical notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                            {laboratory_request.clinical_notes ||
                                'No clinical notes recorded.'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
                {lines.filter(Boolean).map((line, index) => (
                    <p
                        key={index}
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
