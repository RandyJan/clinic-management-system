import ConsultationController from '@/actions/App/Http/Controllers/ConsultationController';
import PatientController from '@/actions/App/Http/Controllers/PatientController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as patientsIndex } from '@/routes/patients';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { ConsultationHistoryItem } from './types';

type PatientSummary = {
    id: number;
    patient_code: string;
    full_name: string;
};

export default function ConsultationHistory({
    patient,
    consultations,
}: {
    patient: PatientSummary;
    consultations: ConsultationHistoryItem[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Patients', href: patientsIndex().url },
        { title: patient.full_name, href: PatientController.show(patient.id).url },
        { title: 'Consultations', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${patient.full_name} Consultations`} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Consultation History
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {patient.full_name} - {patient.patient_code}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={PatientController.show(patient.id).url}>
                            <ArrowLeft />
                            Patient profile
                        </Link>
                    </Button>
                </div>

                {consultations.length === 0 ? (
                    <section className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No completed consultations yet.
                    </section>
                ) : (
                    <section className="grid gap-3">
                        {consultations.map((consultation) => (
                            <Link
                                key={consultation.id}
                                href={
                                    ConsultationController.show(consultation.id)
                                        .url
                                }
                                className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 transition hover:bg-muted md:grid-cols-[1fr_auto] md:items-center dark:border-sidebar-border"
                            >
                                <div className="grid gap-1">
                                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                                        <FileText className="size-4" />
                                        {consultation.consultation_number}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {consultation.diagnosis ??
                                            'No diagnosis recorded'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Dr. {consultation.doctor.full_name} -{' '}
                                        {consultation.appointment.appointment_number}
                                    </p>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatDate(consultation.completed_at)}
                                </div>
                            </Link>
                        ))}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}

function formatDate(value: string | null) {
    if (!value) {
        return 'Not recorded';
    }

    return new Date(value).toLocaleDateString();
}
