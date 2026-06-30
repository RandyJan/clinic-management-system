import PatientController from '@/actions/App/Http/Controllers/PatientController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as patientsIndex } from '@/routes/patients';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { VitalSignList } from './partials';
import { VitalSign } from './types';

type PatientSummary = {
    id: number;
    patient_code: string;
    full_name: string;
};

export default function VitalSignsHistory({
    patient,
    vital_signs,
}: {
    patient: PatientSummary;
    vital_signs: VitalSign[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Patients', href: patientsIndex().url },
        { title: patient.full_name, href: PatientController.show(patient.id).url },
        { title: 'Vital Signs', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${patient.full_name} Vital Signs`} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Vital Signs History
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

                <VitalSignList vitalSigns={vital_signs} />
            </div>
        </AppLayout>
    );
}
