import MedicalRecordController from '@/actions/App/Http/Controllers/MedicalRecordController';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { MedicalRecordContent } from './record-content';
import { MedicalRecord } from './types';

export default function MedicalRecordPrint({
    record,
}: {
    record: MedicalRecord;
}) {
    const patient = record.patient;

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
                <header className="border-b pb-4">
                    <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
                        Clinic Management System
                    </p>
                    <h1 className="text-3xl font-bold">Medical Record</h1>
                    <p className="mt-1 text-sm">
                        {patient.full_name} · {patient.patient_code}
                    </p>
                </header>
                <MedicalRecordContent record={record} />
                <footer className="border-t pt-4 text-xs text-muted-foreground">
                    Confidential medical information. Generated{' '}
                    {new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'long',
                        timeStyle: 'short',
                    }).format(new Date())}
                    .
                </footer>
            </main>
        </>
    );
}
