import PatientController from '@/actions/App/Http/Controllers/PatientController';
import VitalSignController from '@/actions/App/Http/Controllers/VitalSignController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as patientsIndex } from '@/routes/patients';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowLeft } from 'lucide-react';
import { HistorySections } from './show';
import { MedicalHistory, Patient } from './types';

export default function PatientHistory({
    patient,
    medical_history,
}: {
    patient: Patient;
    medical_history: MedicalHistory;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Patients', href: patientsIndex().url },
        { title: patient.full_name, href: PatientController.show(patient.id).url },
        {
            title: 'Medical History',
            href: PatientController.history(patient.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${patient.full_name} Medical History`} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Medical History
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {patient.full_name} · {patient.patient_code}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={VitalSignController.patient(patient.id).url}>
                            <Activity />
                            Vital signs
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={PatientController.show(patient.id).url}>
                            <ArrowLeft />
                            Patient profile
                        </Link>
                    </Button>
                </div>

                <HistorySections medicalHistory={medical_history} />
            </div>
        </AppLayout>
    );
}
