import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import {
    create as appointmentsCreate,
    index as appointmentsIndex,
    show as appointmentShow,
} from '@/routes/appointments';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { List, Plus, Search } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import {
    AppointmentStatusBadge,
    formatTime,
} from './partials';
import {
    AppointmentItem,
    AppointmentStatus,
    DoctorOption,
} from './types';

type Filters = {
    date?: string;
    doctor_id?: string;
    status?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: appointmentsIndex().url },
    { title: 'Calendar', href: '#' },
];

export default function AppointmentCalendar({
    appointments,
    doctors,
    statuses,
    filters,
}: {
    appointments: AppointmentItem[];
    doctors: DoctorOption[];
    statuses: AppointmentStatus[];
    filters: Filters;
}) {
    const [date, setDate] = useState(
        filters.date ?? new Date().toISOString().slice(0, 10),
    );
    const [doctorId, setDoctorId] = useState(
        filters.doctor_id?.toString() ?? 'all',
    );
    const [status, setStatus] = useState(filters.status ?? 'all');
    const slots = useMemo(
        () =>
            [...appointments].sort((first, second) =>
                first.appointment_time.localeCompare(second.appointment_time),
            ),
        [appointments],
    );

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            window.location.pathname,
            {
                date: date || undefined,
                doctor_id: doctorId === 'all' ? undefined : doctorId,
                status: status === 'all' ? undefined : status,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appointment Calendar" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Appointment Calendar
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {slots.length} appointments on selected filters
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={appointmentsIndex().url}>
                                <List />
                                List
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={appointmentsCreate().url}>
                                <Plus />
                                Create
                            </Link>
                        </Button>
                    </div>
                </div>

                <form
                    onSubmit={submitFilters}
                    className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 md:grid-cols-2 xl:grid-cols-4 dark:border-sidebar-border"
                >
                    <div className="grid gap-1">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />
                    </div>
                    <CalendarSelect
                        label="Doctor"
                        value={doctorId}
                        onChange={setDoctorId}
                        options={doctors.map((doctor) => [
                            doctor.id.toString(),
                            doctor.full_name,
                        ])}
                    />
                    <CalendarSelect
                        label="Status"
                        value={status}
                        onChange={setStatus}
                        options={statuses.map((item) => [item, item])}
                    />
                    <div className="flex items-end">
                        <Button type="submit" className="w-full">
                            <Search />
                            Search
                        </Button>
                    </div>
                </form>

                <div className="grid gap-3">
                    {slots.map((appointment) => (
                        <Link
                            key={appointment.id}
                            href={appointmentShow(appointment.id).url}
                            className="grid gap-2 rounded-lg border border-sidebar-border/70 p-4 hover:bg-accent md:grid-cols-[7rem_1fr_auto] md:items-center dark:border-sidebar-border"
                        >
                            <div className="text-xl font-semibold">
                                {formatTime(appointment.appointment_time)}
                            </div>
                            <div>
                                <div className="font-medium">
                                    {appointment.patient.full_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {appointment.doctor.full_name} -{' '}
                                    {appointment.reason_for_visit}
                                </div>
                            </div>
                            <AppointmentStatusBadge
                                status={appointment.status}
                            />
                        </Link>
                    ))}
                    {slots.length === 0 && (
                        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                            No appointments match this calendar view.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function CalendarSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: [string, string][];
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-1">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {options.map(([optionValue, text]) => (
                        <SelectItem key={optionValue} value={optionValue}>
                            {text}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
