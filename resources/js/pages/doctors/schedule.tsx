import DoctorController from '@/actions/App/Http/Controllers/DoctorController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as doctorsIndex } from '@/routes/doctors';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { DoctorActivitySections } from './show';
import { Doctor, DoctorActivity } from './types';

export default function DoctorSchedule({
    doctor,
    appointments,
    consultations,
}: {
    doctor: Doctor;
    appointments: DoctorActivity;
    consultations: DoctorActivity;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Doctors', href: doctorsIndex().url },
        { title: doctor.full_name, href: DoctorController.show(doctor.id).url },
        { title: 'Schedule', href: DoctorController.schedule(doctor.id).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${doctor.full_name} Schedule`} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Doctor Schedule
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {doctor.full_name} - {doctor.doctor_code}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={DoctorController.show(doctor.id).url}>
                            <ArrowLeft />
                            Doctor profile
                        </Link>
                    </Button>
                </div>

                <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="font-semibold">Clinic schedule</h2>
                    <p className="whitespace-pre-line text-sm">
                        {doctor.schedule}
                    </p>
                </section>

                <DoctorActivitySections
                    appointments={appointments}
                    consultations={consultations}
                />
            </div>
        </AppLayout>
    );
}
