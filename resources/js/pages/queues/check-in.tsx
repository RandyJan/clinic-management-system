import QueueController from '@/actions/App/Http/Controllers/QueueController';
import InputError from '@/components/input-error';
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
import { create as queueCreate, index as queuesIndex } from '@/routes/queues';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LogIn } from 'lucide-react';
import { FormEvent } from 'react';
import { DoctorOption, PatientOption } from './types';

type CheckInForm = {
    appointment_id: string;
    patient_id: string;
    doctor_id: string;
    queue_date: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Queue', href: queuesIndex().url },
    { title: 'Check-in', href: queueCreate().url },
];

export default function QueueCheckIn({
    patients,
    doctors,
}: {
    patients: PatientOption[];
    doctors: DoctorOption[];
}) {
    const form = useForm<CheckInForm>({
        appointment_id: '',
        patient_id: '',
        doctor_id: '',
        queue_date: new Date().toISOString().slice(0, 10),
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(QueueController.store().url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Patient Check-in" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Patient Check-in
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add confirmed appointment arrivals to today's queue.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={queuesIndex().url}>
                            <ArrowLeft />
                            Queue list
                        </Link>
                    </Button>
                </div>

                <form
                    onSubmit={submit}
                    className="grid max-w-4xl gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>
                                Patient
                                <span className="text-destructive"> *</span>
                            </Label>
                            <Select
                                value={form.data.patient_id}
                                onValueChange={(value) =>
                                    form.setData('patient_id', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {patients.map((patient) => (
                                        <SelectItem
                                            key={patient.id}
                                            value={patient.id.toString()}
                                        >
                                            {patient.full_name} -{' '}
                                            {patient.patient_code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.patient_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                Doctor
                                <span className="text-destructive"> *</span>
                            </Label>
                            <Select
                                value={form.data.doctor_id}
                                onValueChange={(value) =>
                                    form.setData('doctor_id', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map((doctor) => (
                                        <SelectItem
                                            key={doctor.id}
                                            value={doctor.id.toString()}
                                        >
                                            {doctor.full_name} -{' '}
                                            {doctor.specialization}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.doctor_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="appointment-id">
                                Appointment ID
                            </Label>
                            <Input
                                id="appointment-id"
                                type="number"
                                min="1"
                                value={form.data.appointment_id}
                                onChange={(event) =>
                                    form.setData(
                                        'appointment_id',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.appointment_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="queue-date">Queue date</Label>
                            <Input
                                id="queue-date"
                                type="date"
                                value={form.data.queue_date}
                                onChange={(event) =>
                                    form.setData(
                                        'queue_date',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.queue_date} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <LogIn />
                            Check in patient
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

