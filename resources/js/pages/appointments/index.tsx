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
    calendar as appointmentsCalendar,
    create as appointmentsCreate,
    index as appointmentsIndex,
} from '@/routes/appointments';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Plus, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
    AppointmentPagination,
    AppointmentTable,
} from './partials';
import {
    AppointmentStatus,
    DoctorOption,
    PaginatedAppointments,
    PatientOption,
} from './types';

type Filters = {
    date?: string;
    doctor_id?: string;
    patient_id?: string;
    status?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: appointmentsIndex().url },
];

export default function AppointmentIndex({
    appointments,
    doctors,
    patients,
    statuses,
    filters,
}: {
    appointments: PaginatedAppointments;
    doctors: DoctorOption[];
    patients: PatientOption[];
    statuses: AppointmentStatus[];
    filters: Filters;
}) {
    const [date, setDate] = useState(filters.date ?? '');
    const [doctorId, setDoctorId] = useState(
        filters.doctor_id?.toString() ?? 'all',
    );
    const [patientId, setPatientId] = useState(
        filters.patient_id?.toString() ?? 'all',
    );
    const [status, setStatus] = useState(filters.status ?? 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            appointmentsIndex().url,
            {
                date: date || undefined,
                doctor_id: doctorId === 'all' ? undefined : doctorId,
                patient_id: patientId === 'all' ? undefined : patientId,
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
            <Head title="Appointments" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Appointments
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {appointments.total} scheduled records
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={appointmentsCalendar().url}>
                                <CalendarDays />
                                Calendar
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
                    className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 md:grid-cols-2 xl:grid-cols-5 dark:border-sidebar-border"
                >
                    <div className="grid gap-1">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />
                    </div>
                    <FilterSelect
                        label="Doctor"
                        value={doctorId}
                        onChange={setDoctorId}
                        options={doctors.map((doctor) => [
                            doctor.id.toString(),
                            doctor.full_name,
                        ])}
                    />
                    <FilterSelect
                        label="Patient"
                        value={patientId}
                        onChange={setPatientId}
                        options={patients.map((patient) => [
                            patient.id.toString(),
                            patient.full_name,
                        ])}
                    />
                    <FilterSelect
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

                <AppointmentTable appointments={appointments.data} />
                <AppointmentPagination appointments={appointments} />
            </div>
        </AppLayout>
    );
}

function FilterSelect({
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
