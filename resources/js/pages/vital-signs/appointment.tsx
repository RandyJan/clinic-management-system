import VitalSignController from '@/actions/App/Http/Controllers/VitalSignController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { show as appointmentShow } from '@/routes/appointments';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Plus } from 'lucide-react';
import { VitalSignList } from './partials';
import { VitalSign, VitalSignAppointment } from './types';

export default function AppointmentVitalSigns({
    appointment,
    vital_signs,
}: {
    appointment: VitalSignAppointment;
    vital_signs: VitalSign[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Appointments', href: appointmentShow(appointment.id).url },
        { title: 'Vital Signs', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${appointment.appointment_number} Vital Signs`} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Appointment Vital Signs
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {appointment.patient.full_name} -{' '}
                            {appointment.appointment_number}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={appointmentShow(appointment.id).url}>
                                <ArrowLeft />
                                Appointment
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link
                                href={
                                    VitalSignController.create(appointment.id)
                                        .url
                                }
                            >
                                <Plus />
                                Record
                            </Link>
                        </Button>
                    </div>
                </div>

                <VitalSignList vitalSigns={vital_signs} />
            </div>
        </AppLayout>
    );
}
