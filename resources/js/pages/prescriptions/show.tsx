import PrescriptionController from '@/actions/App/Http/Controllers/PrescriptionController';
import { Button } from '@/components/ui/button';
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
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PackageCheck, Printer } from 'lucide-react';
import { formatDate, StatusBadge } from './prescription-list';
import { PrescriptionDetail } from './types';

export default function PrescriptionShow({
    prescription,
}: {
    prescription: PrescriptionDetail;
}) {
    const permissions = new Set(
        usePage<SharedData>().props.auth.permissions ?? [],
    );
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Prescriptions', href: PrescriptionController.index().url },
        {
            title: prescription.prescription_number,
            href: PrescriptionController.show(prescription.id).url,
        },
    ];

    function dispense() {
        router.patch(
            PrescriptionController.dispense(prescription.id).url,
            {},
            {
                preserveScroll: true,
                onBefore: () =>
                    window.confirm(
                        'Dispense this prescription and deduct inventory stock?',
                    ),
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={prescription.prescription_number} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-semibold">
                                {prescription.prescription_number}
                            </h1>
                            <StatusBadge status={prescription.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Created {formatDate(prescription.created_at)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link
                                href={
                                    PrescriptionController.print(
                                        prescription.id,
                                    ).url
                                }
                            >
                                <Printer />
                                Print
                            </Link>
                        </Button>
                        {prescription.status === 'Pending' &&
                            permissions.has('prescriptions.dispense') && (
                                <Button onClick={dispense}>
                                    <PackageCheck />
                                    Dispense medicines
                                </Button>
                            )}
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <InfoCard
                        title="Patient"
                        lines={[
                            prescription.patient.full_name,
                            prescription.patient.patient_code,
                            prescription.patient.birthdate ??
                                'Birthdate not recorded',
                            prescription.patient.address,
                        ]}
                    />
                    <InfoCard
                        title="Prescriber"
                        lines={[
                            `Dr. ${prescription.doctor.full_name}`,
                            prescription.doctor.specialization,
                            `License: ${prescription.doctor.license_number}`,
                        ]}
                    />
                    <InfoCard
                        title="Consultation"
                        lines={[
                            prescription.consultation.consultation_number,
                            prescription.consultation.diagnosis ??
                                'No diagnosis recorded',
                            prescription.dispensed_at
                                ? `Dispensed ${formatDate(prescription.dispensed_at)}`
                                : 'Not yet dispensed',
                            prescription.dispensed_by
                                ? `By ${prescription.dispensed_by}`
                                : '',
                        ]}
                    />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Medicines</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Dosage</TableHead>
                                        <TableHead>Frequency</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Instructions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prescription.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.medicine_name}
                                            </TableCell>
                                            <TableCell>{item.dosage}</TableCell>
                                            <TableCell>
                                                {item.frequency}
                                            </TableCell>
                                            <TableCell>
                                                {item.duration}
                                            </TableCell>
                                            <TableCell>
                                                {item.quantity}{' '}
                                                {item.unit ?? 'unit(s)'}
                                            </TableCell>
                                            <TableCell>
                                                {item.instructions ?? '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {prescription.items.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-20 text-center text-muted-foreground"
                                            >
                                                Legacy free-text prescription;
                                                no normalized medicine items.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                {prescription.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">
                                {prescription.notes}
                            </p>
                        </CardContent>
                    </Card>
                )}
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
