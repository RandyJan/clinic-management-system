import MedicalRecordController from '@/actions/App/Http/Controllers/MedicalRecordController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Download, Printer } from 'lucide-react';
import { MedicalRecordContent } from './record-content';
import { MedicalRecord } from './types';

export default function MedicalRecordShow({
    record,
}: {
    record: MedicalRecord;
}) {
    const patient = record.patient;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Medical records', href: MedicalRecordController.index().url },
        {
            title: patient.full_name,
            href: MedicalRecordController.show(patient.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${patient.full_name} medical record`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Patient medical record
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {patient.full_name} · {patient.patient_code}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link
                                href={
                                    MedicalRecordController.print(patient.id)
                                        .url
                                }
                            >
                                <Printer />
                                Printable view
                            </Link>
                        </Button>
                        <Button asChild>
                            <a
                                href={
                                    MedicalRecordController.export(patient.id)
                                        .url
                                }
                            >
                                <Download />
                                Export PDF
                            </a>
                        </Button>
                    </div>
                </div>
                <MedicalRecordContent record={record} />
            </div>
        </AppLayout>
    );
}
