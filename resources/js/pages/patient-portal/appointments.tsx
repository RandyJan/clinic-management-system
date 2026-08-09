import PatientPortalController from '@/actions/App/Http/Controllers/PatientPortalController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { AppointmentTable } from '../appointments/partials';
import { PortalHeader, PortalPagination } from './partials';
import { PortalAppointmentsProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patient Portal', href: PatientPortalController.dashboard().url },
    {
        title: 'My Appointments',
        href: PatientPortalController.appointments().url,
    },
];

export default function PatientPortalAppointments({
    appointments,
}: PortalAppointmentsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Appointments" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <PortalHeader
                    title="My appointments"
                    description={`${appointments.total} appointment records`}
                    action={
                        <Button asChild>
                            <Link
                                href={
                                    PatientPortalController.createAppointment()
                                        .url
                                }
                            >
                                <Plus />
                                Request appointment
                            </Link>
                        </Button>
                    }
                />

                <AppointmentTable
                    appointments={appointments.data}
                    actions={false}
                />
                <PortalPagination pagination={appointments} />
            </div>
        </AppLayout>
    );
}
