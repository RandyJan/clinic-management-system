import PatientPortalController from '@/actions/App/Http/Controllers/PatientPortalController';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import { FormEvent } from 'react';
import { PortalHeader } from './partials';

type DoctorOption = {
    id: number;
    full_name: string;
    specialization: string;
};

type AppointmentRequestForm = {
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    reason_for_visit: string;
    appointment_type: string;
    remarks: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patient Portal', href: PatientPortalController.dashboard().url },
    {
        title: 'Request Appointment',
        href: PatientPortalController.createAppointment().url,
    },
];

export default function RequestAppointment({
    doctors,
    appointment_types,
}: {
    doctors: DoctorOption[];
    appointment_types: string[];
}) {
    const form = useForm<AppointmentRequestForm>({
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        reason_for_visit: '',
        appointment_type: 'Consultation',
        remarks: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(PatientPortalController.storeAppointment().url, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Request Appointment" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <PortalHeader
                    title="Request appointment"
                    description="Choose your preferred doctor, date, and time. Clinic staff will confirm the schedule."
                    action={
                        <Button variant="outline" asChild>
                            <Link
                                href={
                                    PatientPortalController.appointments().url
                                }
                            >
                                <ArrowLeft />
                                Back
                            </Link>
                        </Button>
                    }
                />

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 md:grid-cols-2 dark:border-sidebar-border"
                >
                    <div className="grid gap-2">
                        <Label>Doctor</Label>
                        <Select
                            value={form.data.doctor_id}
                            onValueChange={(value) =>
                                form.setData('doctor_id', value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose doctor" />
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
                        <Label>Appointment type</Label>
                        <Select
                            value={form.data.appointment_type}
                            onValueChange={(value) =>
                                form.setData('appointment_type', value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {appointment_types.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.appointment_type} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="appointment-date">Preferred date</Label>
                        <Input
                            id="appointment-date"
                            type="date"
                            value={form.data.appointment_date}
                            onChange={(event) =>
                                form.setData(
                                    'appointment_date',
                                    event.target.value,
                                )
                            }
                        />
                        <InputError message={form.errors.appointment_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="appointment-time">Preferred time</Label>
                        <Input
                            id="appointment-time"
                            type="time"
                            value={form.data.appointment_time}
                            onChange={(event) =>
                                form.setData(
                                    'appointment_time',
                                    event.target.value,
                                )
                            }
                        />
                        <InputError message={form.errors.appointment_time} />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="reason-for-visit">
                            Reason for visit
                        </Label>
                        <Input
                            id="reason-for-visit"
                            value={form.data.reason_for_visit}
                            onChange={(event) =>
                                form.setData(
                                    'reason_for_visit',
                                    event.target.value,
                                )
                            }
                        />
                        <InputError message={form.errors.reason_for_visit} />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                            id="remarks"
                            value={form.data.remarks}
                            onChange={(event) =>
                                form.setData('remarks', event.target.value)
                            }
                        />
                        <InputError message={form.errors.remarks} />
                    </div>

                    <div className="flex justify-end md:col-span-2">
                        <Button type="submit" disabled={form.processing}>
                            <Send />
                            Submit request
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
