import ConsultationController from '@/actions/App/Http/Controllers/ConsultationController';
import PatientController from '@/actions/App/Http/Controllers/PatientController';
import VitalSignController from '@/actions/App/Http/Controllers/VitalSignController';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as patientsIndex } from '@/routes/patients';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    CalendarClock,
    FileClock,
    FileText,
    PencilLine,
    UserRound,
    XCircle,
} from 'lucide-react';
import { formatDate, StatusBadge } from './index';
import { MedicalHistory, Patient } from './types';

const historyLabels = {
    appointments: 'Appointment history',
    vital_signs: 'Vital signs',
    consultations: 'Consultation history',
    prescriptions: 'Prescriptions',
    laboratory_requests: 'Laboratory requests',
    billing_history: 'Billing history',
};

export default function PatientShow({
    patient,
    medical_history,
}: {
    patient: Patient;
    medical_history: MedicalHistory;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Patients', href: patientsIndex().url },
        { title: patient.full_name, href: PatientController.show(patient.id).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={patient.full_name} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold">
                                {patient.full_name}
                            </h1>
                            <StatusBadge status={patient.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {patient.patient_code} · {patient.age ?? 'No age'} years old
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={VitalSignController.patient(patient.id).url}>
                                <Activity />
                                Vital signs
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={PatientController.history(patient.id).url}>
                                <FileClock />
                                Medical history
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={PatientController.edit(patient.id).url}>
                                <PencilLine />
                                Edit
                            </Link>
                        </Button>
                        <DeactivatePatientButton patient={patient} />
                    </div>
                </div>

                <Tabs defaultValue="profile" className="gap-4">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="profile">
                            <UserRound />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <CalendarClock />
                            Medical information
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="grid gap-4">
                        <InfoSection
                            title="Personal information"
                            items={[
                                ['Gender', titleCase(patient.gender)],
                                ['Birthdate', patient.birthdate],
                                ['Age', patient.age?.toString() ?? 'Not available'],
                                ['Civil status', titleCase(patient.civil_status)],
                                ['Blood type', patient.blood_type ?? 'Not recorded'],
                                ['Created', formatDate(patient.created_at)],
                            ]}
                        />
                        <InfoSection
                            title="Contact information"
                            items={[
                                ['Contact number', patient.contact_number],
                                ['Email', patient.email ?? 'Not recorded'],
                                ['Address', patient.address ?? 'Not recorded'],
                                [
                                    'Emergency contact',
                                    patient.emergency_contact_name
                                        ? `${patient.emergency_contact_name} (${patient.emergency_contact_number ?? 'No number'})`
                                        : 'Not recorded',
                                ],
                            ]}
                        />
                        <InfoSection
                            title="Medical notes"
                            items={[
                                ['Allergies', patient.allergies ?? 'None recorded'],
                                [
                                    'Existing conditions',
                                    patient.existing_conditions ?? 'None recorded',
                                ],
                            ]}
                        />
                    </TabsContent>
                    <TabsContent value="history">
                        <HistorySections medicalHistory={medical_history} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

export function HistorySections({
    medicalHistory,
}: {
    medicalHistory: MedicalHistory;
}) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(historyLabels).map(([key, label]) => (
                <section
                    key={key}
                    className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <div>
                        <h2 className="font-semibold">{label}</h2>
                        <p className="text-sm text-muted-foreground">
                            {medicalHistory[key as keyof MedicalHistory].length} records
                        </p>
                    </div>
                    {key === 'consultations' &&
                    medicalHistory.consultations.length > 0 ? (
                        <div className="grid gap-3">
                            {medicalHistory.consultations
                                .slice(0, 4)
                                .map((consultation) => (
                                    <Link
                                        key={consultation.id}
                                        href={
                                            ConsultationController.show(
                                                consultation.id,
                                            ).url
                                        }
                                        className="grid gap-1 rounded-md border p-3 text-sm transition hover:bg-muted"
                                    >
                                        <span className="flex items-center gap-2 font-medium">
                                            <FileText className="size-4" />
                                            {consultation.consultation_number}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {consultation.diagnosis ??
                                                'No diagnosis recorded'}
                                        </span>
                                    </Link>
                                ))}
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No records yet.
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}

function InfoSection({
    title,
    items,
}: {
    title: string;
    items: [string, string][];
}) {
    return (
        <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <h2 className="font-semibold">{title}</h2>
            <dl className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map(([label, value]) => (
                    <div key={label} className="grid gap-1">
                        <dt className="text-xs font-medium text-muted-foreground">
                            {label}
                        </dt>
                        <dd className="min-w-0 text-sm break-words">{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

function DeactivatePatientButton({ patient }: { patient: Patient }) {
    if (patient.status === 'inactive') {
        return (
            <Button variant="outline" disabled>
                <XCircle />
                Inactive
            </Button>
        );
    }

    function deactivate() {
        router.patch(PatientController.deactivate(patient.id).url, {}, {
            preserveScroll: true,
        });
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <XCircle />
                    Deactivate
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate patient</AlertDialogTitle>
                    <AlertDialogDescription>
                        This keeps the patient record available but marks it inactive.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={deactivate}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        Deactivate
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function titleCase(value: string | null | undefined) {
    if (!value) {
        return 'Not recorded';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}
