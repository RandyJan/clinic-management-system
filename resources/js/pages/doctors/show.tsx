import DoctorController from '@/actions/App/Http/Controllers/DoctorController';
import { Button } from '@/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as doctorsIndex } from '@/routes/doctors';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, ClipboardList, PencilLine, Stethoscope } from 'lucide-react';
import { formatCurrency, formatDate, StatusBadge } from './index';
import { Doctor, DoctorActivity } from './types';

export default function DoctorShow({
    doctor,
    appointments,
    consultations,
}: {
    doctor: Doctor;
    appointments: DoctorActivity;
    consultations: DoctorActivity;
}) {
    const { auth } = usePage<SharedData>().props;
    const canUpdate = new Set(auth.permissions ?? []).has('doctors.update');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Doctors', href: doctorsIndex().url },
        { title: doctor.full_name, href: DoctorController.show(doctor.id).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={doctor.full_name} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold">
                                {doctor.full_name}
                            </h1>
                            <StatusBadge status={doctor.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {doctor.doctor_code} - {doctor.specialization}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={DoctorController.schedule(doctor.id).url}>
                                <CalendarDays />
                                Schedule
                            </Link>
                        </Button>
                        {canUpdate && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={DoctorController.edit(doctor.id).url}
                                >
                                    <PencilLine />
                                    Edit
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <Tabs defaultValue="profile" className="gap-4">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="profile">
                            <Stethoscope />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="activity">
                            <ClipboardList />
                            Appointments
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="grid gap-4">
                        <InfoSection
                            title="Doctor information"
                            items={[
                                ['Specialization', doctor.specialization],
                                ['License number', doctor.license_number],
                                ['Consultation fee', formatCurrency(doctor.consultation_fee)],
                                ['Status', doctor.status],
                                ['Created', formatDate(doctor.created_at)],
                            ]}
                        />
                        <InfoSection
                            title="Contact and account"
                            items={[
                                ['Contact number', doctor.contact_number ?? 'Not recorded'],
                                ['Email', doctor.email ?? 'Not recorded'],
                                ['Linked account', doctor.user?.name ?? 'Not linked'],
                                ['Account email', doctor.user?.email ?? 'Not recorded'],
                            ]}
                        />
                        <InfoSection
                            title="Clinic schedule"
                            items={[['Schedule', doctor.schedule]]}
                        />
                    </TabsContent>
                    <TabsContent value="activity">
                        <DoctorActivitySections
                            appointments={appointments}
                            consultations={consultations}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

export function DoctorActivitySections({
    appointments,
    consultations,
}: {
    appointments: DoctorActivity;
    consultations: DoctorActivity;
}) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <ActivityPanel title="Appointments" records={appointments} />
            <ActivityPanel title="Consultations" records={consultations} />
        </div>
    );
}

function ActivityPanel({
    title,
    records,
}: {
    title: string;
    records: DoctorActivity;
}) {
    return (
        <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">
                    {records.length} records
                </p>
            </div>
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No records yet.
            </div>
        </section>
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
