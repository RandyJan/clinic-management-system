import AppointmentController from '@/actions/App/Http/Controllers/AppointmentController';
import ConsultationController from '@/actions/App/Http/Controllers/ConsultationController';
import VitalSignController from '@/actions/App/Http/Controllers/VitalSignController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import {
    edit as appointmentEdit,
    index as appointmentsIndex,
    show as appointmentShow,
} from '@/routes/appointments';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    LogIn,
    Pencil,
    FileClock,
    ClipboardPlus,
    FileText,
    Stethoscope,
    XCircle,
} from 'lucide-react';
import {
    AppointmentStatusBadge,
    formatDate,
    formatTime,
} from './partials';
import { AppointmentItem } from './types';
import { VitalSignSummary } from '../vital-signs/partials';
import { VitalSign } from '../vital-signs/types';

export default function AppointmentShow({
    appointment,
    latest_vital_signs,
}: {
    appointment: AppointmentItem;
    latest_vital_signs: VitalSign | null;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Appointments', href: appointmentsIndex().url },
        {
            title: appointment.appointment_number,
            href: appointmentShow(appointment.id).url,
        },
    ];

    function patch(url: string) {
        router.patch(url, {}, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={appointment.appointment_number} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="grid gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={appointmentsIndex().url}>
                                <ArrowLeft />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {appointment.appointment_number}
                            </h1>
                            <div className="mt-2">
                                <AppointmentStatusBadge
                                    status={appointment.status}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={appointmentEdit(appointment.id).url}>
                                <Pencil />
                                Edit
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link
                                href={
                                    VitalSignController.appointment(
                                        appointment.id,
                                    ).url
                                }
                            >
                                <FileClock />
                                Vitals
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link
                                href={
                                    VitalSignController.create(appointment.id)
                                        .url
                                }
                            >
                                <ClipboardPlus />
                                Record vitals
                            </Link>
                        </Button>
                        {appointment.consultation && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={
                                        appointment.consultation.status ===
                                        'Completed'
                                            ? ConsultationController.show(
                                                  appointment.consultation.id,
                                              ).url
                                            : ConsultationController.edit(
                                                  appointment.consultation.id,
                                              ).url
                                    }
                                >
                                    <FileText />
                                    Consultation
                                </Link>
                            </Button>
                        )}
                        {(appointment.status === 'Pending' ||
                            appointment.status === 'Confirmed') && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    patch(
                                        AppointmentController.checkIn(
                                            appointment.id,
                                        ).url,
                                    )
                                }
                            >
                                <LogIn />
                                Check in
                            </Button>
                        )}
                        {appointment.status === 'Checked-in' && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    patch(
                                        AppointmentController.start(
                                            appointment.id,
                                        ).url,
                                    )
                                }
                            >
                                <Stethoscope />
                                Start
                            </Button>
                        )}
                        {appointment.status === 'In Consultation' && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    patch(
                                        AppointmentController.complete(
                                            appointment.id,
                                        ).url,
                                    )
                                }
                            >
                                <CheckCircle2 />
                                Complete
                            </Button>
                        )}
                        {!['Completed', 'Cancelled', 'No-show'].includes(
                            appointment.status,
                        ) && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    patch(
                                        AppointmentController.cancel(
                                            appointment.id,
                                        ).url,
                                    )
                                }
                            >
                                <XCircle />
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="font-semibold">Schedule</h2>
                        <Detail label="Date" value={formatDate(appointment.appointment_date)} />
                        <Detail label="Time" value={formatTime(appointment.appointment_time)} />
                        <Detail label="Type" value={appointment.appointment_type} />
                    </section>
                    <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="font-semibold">Patient</h2>
                        <Detail label="Name" value={appointment.patient.full_name} />
                        <Detail label="Code" value={appointment.patient.patient_code} />
                    </section>
                    <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="font-semibold">Doctor</h2>
                        <Detail label="Name" value={appointment.doctor.full_name} />
                        <Detail label="Specialization" value={appointment.doctor.specialization} />
                    </section>
                </div>

                <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="font-semibold">Visit notes</h2>
                    <Detail label="Reason for visit" value={appointment.reason_for_visit} />
                    <Detail label="Remarks" value={appointment.remarks ?? 'None'} />
                </section>

                <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold">Vital signs</h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link
                                href={
                                    VitalSignController.appointment(
                                        appointment.id,
                                    ).url
                                }
                            >
                                <FileClock />
                                View history
                            </Link>
                        </Button>
                    </div>
                    <VitalSignSummary
                        vitalSign={latest_vital_signs}
                        emptyActionHref={
                            VitalSignController.create(appointment.id).url
                        }
                    />
                </section>
            </div>
        </AppLayout>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}
