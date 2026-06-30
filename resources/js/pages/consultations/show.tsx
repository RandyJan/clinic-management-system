import ConsultationController from '@/actions/App/Http/Controllers/ConsultationController';
import PatientController from '@/actions/App/Http/Controllers/PatientController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { show as appointmentShow } from '@/routes/appointments';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileClock, Pencil, Pill, TestTube2 } from 'lucide-react';
import { ReactNode } from 'react';
import { ConsultationRecord } from './types';

export default function ConsultationShow({
    consultation,
}: {
    consultation: ConsultationRecord;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Appointments',
            href: appointmentShow(consultation.appointment_id).url,
        },
        {
            title: consultation.consultation_number,
            href: ConsultationController.show(consultation.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={consultation.consultation_number} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="grid gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={appointmentShow(consultation.appointment_id).url}>
                                <ArrowLeft />
                                Appointment
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {consultation.consultation_number}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {consultation.patient.full_name} -{' '}
                                {consultation.status}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {consultation.status !== 'Completed' && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={
                                        ConsultationController.edit(
                                            consultation.id,
                                        ).url
                                    }
                                >
                                    <Pencil />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href={PatientController.history(consultation.patient_id).url}>
                                <FileClock />
                                Medical record
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="font-semibold">Patient</h2>
                        <Detail label="Name" value={consultation.patient.full_name} />
                        <Detail
                            label="Code"
                            value={consultation.patient.patient_code}
                        />
                    </section>
                    <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="font-semibold">Doctor</h2>
                        <Detail label="Name" value={consultation.doctor.full_name} />
                        <Detail
                            label="Specialization"
                            value={consultation.doctor.specialization}
                        />
                    </section>
                    <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="font-semibold">Timeline</h2>
                        <Detail
                            label="Started"
                            value={formatDateTime(consultation.started_at)}
                        />
                        <Detail
                            label="Completed"
                            value={formatDateTime(consultation.completed_at)}
                        />
                    </section>
                </div>

                <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="font-semibold">Clinical notes</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Detail
                            label="Chief complaint"
                            value={consultation.chief_complaint ?? 'Not recorded'}
                        />
                        <Detail
                            label="History of present illness"
                            value={
                                consultation.history_of_present_illness ??
                                'Not recorded'
                            }
                        />
                        <Detail
                            label="Diagnosis"
                            value={consultation.diagnosis ?? 'Not recorded'}
                        />
                        <Detail
                            label="Treatment plan"
                            value={consultation.treatment_plan ?? 'Not recorded'}
                        />
                        <Detail
                            label="Doctor notes"
                            value={consultation.doctor_notes ?? 'Not recorded'}
                        />
                        <Detail
                            label="Follow-up"
                            value={consultation.follow_up_date ?? 'Not set'}
                        />
                    </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                    <RelatedSection
                        title="Prescriptions"
                        icon={<Pill className="size-4" />}
                        empty="No prescriptions recorded."
                    >
                        {consultation.prescriptions.map((prescription) => (
                            <div key={prescription.id} className="grid gap-1">
                                <div className="font-medium">
                                    {prescription.medications}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {prescription.instructions ??
                                        'No instructions'}
                                </div>
                            </div>
                        ))}
                    </RelatedSection>
                    <RelatedSection
                        title="Laboratory requests"
                        icon={<TestTube2 className="size-4" />}
                        empty="No laboratory requests recorded."
                    >
                        {consultation.laboratory_requests.map((request) => (
                            <div key={request.id} className="grid gap-1">
                                <div className="font-medium">
                                    {request.tests}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {request.instructions ?? 'No instructions'} -{' '}
                                    {request.status}
                                </div>
                            </div>
                        ))}
                    </RelatedSection>
                </div>
            </div>
        </AppLayout>
    );
}

function RelatedSection({
    title,
    icon,
    empty,
    children,
}: {
    title: string;
    icon: ReactNode;
    empty: string;
    children: ReactNode;
}) {
    const items = Array.isArray(children) ? children : [children];
    const hasItems = items.some(Boolean);

    return (
        <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <div className="flex items-center gap-2 font-semibold">
                {icon}
                <h2>{title}</h2>
            </div>
            {hasItems ? (
                <div className="grid gap-3">{children}</div>
            ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    {empty}
                </div>
            )}
        </section>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1">
            <div className="text-xs font-medium text-muted-foreground">
                {label}
            </div>
            <div className="min-w-0 text-sm break-words">{value}</div>
        </div>
    );
}

function formatDateTime(value: string | null) {
    if (!value) {
        return 'Not recorded';
    }

    return new Date(value).toLocaleString();
}
