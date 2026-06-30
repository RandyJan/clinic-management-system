import AppointmentController from '@/actions/App/Http/Controllers/AppointmentController';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { show as appointmentShow } from '@/routes/appointments';
import { Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    LogIn,
    Pencil,
    Stethoscope,
    XCircle,
} from 'lucide-react';
import {
    AppointmentItem,
    AppointmentStatus,
    PaginatedAppointments,
} from './types';

const statusClasses: Record<AppointmentStatus, string> = {
    Pending: 'bg-amber-600 text-white hover:bg-amber-600',
    Confirmed: 'bg-cyan-700 text-white hover:bg-cyan-700',
    'Checked-in': 'bg-indigo-600 text-white hover:bg-indigo-600',
    'In Consultation': 'bg-blue-600 text-white hover:bg-blue-600',
    Completed: 'bg-emerald-600 text-white hover:bg-emerald-600',
    Cancelled: 'bg-red-600 text-white hover:bg-red-600',
    'No-show': 'bg-zinc-600 text-white hover:bg-zinc-600',
};

export function AppointmentStatusBadge({
    status,
}: {
    status: AppointmentStatus;
}) {
    return <Badge className={statusClasses[status]}>{status}</Badge>;
}

export function AppointmentTable({
    appointments,
    actions = true,
}: {
    appointments: AppointmentItem[];
    actions?: boolean;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Appointment</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Status</TableHead>
                        {actions && (
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                            <TableCell className="min-w-44">
                                <Link
                                    href={appointmentShow(appointment.id).url}
                                    className="font-semibold hover:underline"
                                >
                                    {appointment.appointment_number}
                                </Link>
                                <div className="text-sm text-muted-foreground">
                                    {appointment.appointment_type}
                                </div>
                            </TableCell>
                            <TableCell className="min-w-56">
                                <div className="font-medium">
                                    {appointment.patient.full_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {appointment.patient.patient_code}
                                </div>
                            </TableCell>
                            <TableCell className="min-w-48">
                                <div>{appointment.doctor.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {appointment.doctor.specialization}
                                </div>
                            </TableCell>
                            <TableCell className="min-w-36">
                                <div>{formatDate(appointment.appointment_date)}</div>
                                <div className="text-sm text-muted-foreground">
                                    {formatTime(appointment.appointment_time)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <AppointmentStatusBadge
                                    status={appointment.status}
                                />
                            </TableCell>
                            {actions && (
                                <TableCell>
                                    <AppointmentActions
                                        appointment={appointment}
                                    />
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {appointments.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={actions ? 6 : 5}
                                className="h-24 text-center text-muted-foreground"
                            >
                                No appointments found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export function AppointmentActions({
    appointment,
}: {
    appointment: AppointmentItem;
}) {
    function patch(url: string) {
        router.patch(url, {}, { preserveScroll: true });
    }

    return (
        <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" asChild>
                <Link href={AppointmentController.edit(appointment.id).url}>
                    <Pencil />
                    Edit
                </Link>
            </Button>
            {appointment.status === 'Pending' ||
            appointment.status === 'Confirmed' ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        patch(AppointmentController.checkIn(appointment.id).url)
                    }
                >
                    <LogIn />
                    Check in
                </Button>
            ) : null}
            {appointment.status === 'Checked-in' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        patch(AppointmentController.start(appointment.id).url)
                    }
                >
                    <Stethoscope />
                    Start
                </Button>
            )}
            {appointment.status === 'In Consultation' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        patch(AppointmentController.complete(appointment.id).url)
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
                    size="sm"
                    onClick={() =>
                        patch(AppointmentController.cancel(appointment.id).url)
                    }
                >
                    <XCircle />
                    Cancel
                </Button>
            )}
        </div>
    );
}

export function AppointmentPagination({
    appointments,
}: {
    appointments: PaginatedAppointments;
}) {
    if (appointments.links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {appointments.from ?? 0} to {appointments.to ?? 0} of{' '}
                {appointments.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                {appointments.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            className={cn(
                                buttonVariants({
                                    variant: link.active
                                        ? 'default'
                                        : 'outline',
                                    size: 'sm',
                                }),
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={`${link.label}-${index}`}
                            className={cn(
                                buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                }),
                                'pointer-events-none opacity-50',
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </div>
    );
}

export function formatDate(value: string | null | undefined) {
    if (!value) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(`${value}T00:00:00`));
}

export function formatTime(value: string | null | undefined) {
    if (!value) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat(undefined, {
        timeStyle: 'short',
    }).format(new Date(`1970-01-01T${value}`));
}
