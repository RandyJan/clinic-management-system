import AppointmentController from '@/actions/App/Http/Controllers/AppointmentController';
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
import { index as appointmentsIndex } from '@/routes/appointments';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEvent, ReactNode } from 'react';
import {
    AppointmentFormData,
    AppointmentItem,
    AppointmentStatus,
    DoctorOption,
    PatientOption,
} from './types';

const emptyForm: AppointmentFormData = {
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason_for_visit: '',
    appointment_type: '',
    status: 'Pending',
    remarks: '',
};

export default function AppointmentFormPage({
    appointment,
    patients,
    doctors,
    statuses,
}: {
    appointment?: AppointmentItem;
    patients: PatientOption[];
    doctors: DoctorOption[];
    statuses: AppointmentStatus[];
}) {
    const isEditing = appointment !== undefined;
    const form = useForm<AppointmentFormData>(
        appointment
            ? {
                  patient_id: appointment.patient_id.toString(),
                  doctor_id: appointment.doctor_id.toString(),
                  appointment_date: appointment.appointment_date,
                  appointment_time: appointment.appointment_time,
                  reason_for_visit: appointment.reason_for_visit,
                  appointment_type: appointment.appointment_type,
                  status: appointment.status,
                  remarks: appointment.remarks ?? '',
              }
            : emptyForm,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Appointments', href: appointmentsIndex().url },
        {
            title: isEditing ? 'Edit Appointment' : 'Create Appointment',
            href: isEditing
                ? AppointmentController.edit(appointment.id).url
                : AppointmentController.create().url,
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (appointment) {
            form.put(AppointmentController.update(appointment.id).url, {
                preserveScroll: true,
            });

            return;
        }

        form.post(AppointmentController.store().url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Appointment' : 'Create Appointment'} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {isEditing
                                ? 'Edit Appointment'
                                : 'Create Appointment'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {appointment?.appointment_number ??
                                'Assign a patient to a doctor schedule'}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={appointmentsIndex().url}>
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                </div>

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <Section title="Schedule">
                        <SelectField
                            label="Patient"
                            value={form.data.patient_id}
                            error={form.errors.patient_id}
                            required
                            options={patients.map((patient) => [
                                patient.id.toString(),
                                `${patient.full_name} (${patient.patient_code})`,
                            ])}
                            onChange={(value) => form.setData('patient_id', value)}
                        />
                        <SelectField
                            label="Doctor"
                            value={form.data.doctor_id}
                            error={form.errors.doctor_id}
                            required
                            options={doctors.map((doctor) => [
                                doctor.id.toString(),
                                `${doctor.full_name} - ${doctor.specialization}`,
                            ])}
                            onChange={(value) => form.setData('doctor_id', value)}
                        />
                        <TextField
                            label="Appointment date"
                            type="date"
                            value={form.data.appointment_date}
                            error={form.errors.appointment_date}
                            required
                            onChange={(value) =>
                                form.setData('appointment_date', value)
                            }
                        />
                        <TextField
                            label="Appointment time"
                            type="time"
                            value={form.data.appointment_time}
                            error={form.errors.appointment_time}
                            required
                            onChange={(value) =>
                                form.setData('appointment_time', value)
                            }
                        />
                    </Section>

                    <Section title="Visit details">
                        <TextField
                            label="Appointment type"
                            value={form.data.appointment_type}
                            error={form.errors.appointment_type}
                            required
                            onChange={(value) =>
                                form.setData('appointment_type', value)
                            }
                        />
                        {isEditing && (
                            <SelectField
                                label="Status"
                                value={form.data.status}
                                error={form.errors.status}
                                required
                                options={statuses.map((status) => [
                                    status,
                                    status,
                                ])}
                                onChange={(value) =>
                                    form.setData(
                                        'status',
                                        value as AppointmentStatus,
                                    )
                                }
                            />
                        )}
                        <TextAreaField
                            label="Reason for visit"
                            value={form.data.reason_for_visit}
                            error={form.errors.reason_for_visit}
                            required
                            className="md:col-span-2"
                            onChange={(value) =>
                                form.setData('reason_for_visit', value)
                            }
                        />
                        <TextAreaField
                            label="Remarks"
                            value={form.data.remarks}
                            error={form.errors.remarks}
                            className="md:col-span-2"
                            onChange={(value) => form.setData('remarks', value)}
                        />
                    </Section>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            Save appointment
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="grid gap-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {children}
            </div>
        </section>
    );
}

function TextField({
    label,
    value,
    error,
    required,
    type = 'text',
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    required?: boolean;
    type?: string;
    onChange: (value: string) => void;
}) {
    const id = label.toLowerCase().replaceAll(' ', '-');

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
                id={id}
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function SelectField({
    label,
    value,
    error,
    required,
    options,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    required?: boolean;
    options: [string, string][];
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map(([optionValue, text]) => (
                        <SelectItem key={optionValue} value={optionValue}>
                            {text}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={error} />
        </div>
    );
}

function TextAreaField({
    label,
    value,
    error,
    required,
    className,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    required?: boolean;
    className?: string;
    onChange: (value: string) => void;
}) {
    const id = label.toLowerCase().replaceAll(' ', '-');

    return (
        <div className={`grid gap-2 ${className ?? ''}`}>
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}
