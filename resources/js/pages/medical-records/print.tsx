import MedicalRecordController from '@/actions/App/Http/Controllers/MedicalRecordController';
import {
    PrintClinicHeader,
    PrintFooter,
} from '@/components/print-clinic-header';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { MedicalRecordContent } from './record-content';
import { MedicalRecord } from './types';

export default function MedicalRecordPrint({
    record,
}: {
    record: MedicalRecord;
}) {
    const { clinic } = usePage<SharedData>().props;
    const patient = record.patient;
    const clinicContact = [
        clinic.clinic_address,
        clinic.contact_number,
        clinic.email,
    ]
        .filter(Boolean)
        .join(' | ');

    return (
        <>
            <Head title={`${patient.full_name} printable medical record`} />
            <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-background p-4 text-foreground sm:p-8 print:max-w-none print:p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Button variant="outline" asChild>
                        <Link
                            href={MedicalRecordController.show(patient.id).url}
                        >
                            <ArrowLeft />
                            Back to record
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
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
                        <Button onClick={() => window.print()}>
                            <Printer />
                            Print
                        </Button>
                    </div>
                </div>

                <PrintClinicHeader
                    clinic={clinic}
                    title="Medical Record"
                    reference={`${patient.full_name} | ${patient.patient_code}`}
                />

                <MedicalRecordContent record={record} />

                <footer className="border-t pt-4 text-xs text-muted-foreground">
                    Confidential medical information. Generated{' '}
                    {new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'long',
                        timeStyle: 'short',
                    }).format(new Date())}
                    .
                    <div className="mt-4 text-black">
                        <PrintFooter>{clinicContact}</PrintFooter>
                    </div>
                </footer>
            </main>
        </>
    );
}
