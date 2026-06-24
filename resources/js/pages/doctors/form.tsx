import DoctorController from '@/actions/App/Http/Controllers/DoctorController';
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
import { index as doctorsIndex } from '@/routes/doctors';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';
import { Doctor, DoctorFormData, UserOption } from './types';

const emptyForm: DoctorFormData = {
    user_id: '',
    first_name: '',
    last_name: '',
    specialization: '',
    license_number: '',
    contact_number: '',
    email: '',
    consultation_fee: '',
    schedule: '',
    status: 'active',
};

export default function DoctorFormPage({
    doctor,
    users,
}: {
    doctor?: Doctor;
    users: UserOption[];
}) {
    const isEditing = doctor !== undefined;
    const form = useForm<DoctorFormData>(
        doctor
            ? {
                  user_id: doctor.user_id.toString(),
                  first_name: doctor.first_name,
                  last_name: doctor.last_name,
                  specialization: doctor.specialization,
                  license_number: doctor.license_number,
                  contact_number: doctor.contact_number ?? '',
                  email: doctor.email ?? '',
                  consultation_fee: doctor.consultation_fee,
                  schedule: doctor.schedule,
                  status: doctor.status,
              }
            : emptyForm,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Doctors', href: doctorsIndex().url },
        {
            title: isEditing ? 'Edit Doctor' : 'Create Doctor',
            href: isEditing
                ? DoctorController.edit(doctor.id).url
                : DoctorController.create().url,
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (doctor) {
            form.put(DoctorController.update(doctor.id).url, {
                preserveScroll: true,
            });

            return;
        }

        form.post(DoctorController.store().url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Doctor' : 'Create Doctor'} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {isEditing ? 'Edit Doctor' : 'Create Doctor'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {doctor?.doctor_code ?? 'Link a user account to a doctor profile'}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={doctorsIndex().url}>
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                </div>

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <Section title="Account link">
                        <div className="grid gap-2 lg:col-span-2">
                            <Label>
                                User account
                                <span className="text-destructive"> *</span>
                            </Label>
                            <Select
                                value={form.data.user_id}
                                onValueChange={(value) =>
                                    form.setData('user_id', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem
                                            key={user.id}
                                            value={user.id.toString()}
                                        >
                                            {user.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.user_id} />
                        </div>
                        <SelectField
                            label="Status"
                            value={form.data.status}
                            options={[
                                ['active', 'Active'],
                                ['inactive', 'Inactive'],
                            ]}
                            error={form.errors.status}
                            onChange={(value) => form.setData('status', value)}
                        />
                    </Section>

                    <Section title="Doctor details">
                        <TextField
                            label="First name"
                            value={form.data.first_name}
                            error={form.errors.first_name}
                            required
                            onChange={(value) =>
                                form.setData('first_name', value)
                            }
                        />
                        <TextField
                            label="Last name"
                            value={form.data.last_name}
                            error={form.errors.last_name}
                            required
                            onChange={(value) =>
                                form.setData('last_name', value)
                            }
                        />
                        <TextField
                            label="Specialization"
                            value={form.data.specialization}
                            error={form.errors.specialization}
                            required
                            onChange={(value) =>
                                form.setData('specialization', value)
                            }
                        />
                        <TextField
                            label="License number"
                            value={form.data.license_number}
                            error={form.errors.license_number}
                            required
                            onChange={(value) =>
                                form.setData('license_number', value)
                            }
                        />
                        <TextField
                            label="Contact number"
                            value={form.data.contact_number}
                            error={form.errors.contact_number}
                            onChange={(value) =>
                                form.setData('contact_number', value)
                            }
                        />
                        <TextField
                            label="Email"
                            type="email"
                            value={form.data.email}
                            error={form.errors.email}
                            onChange={(value) => form.setData('email', value)}
                        />
                        <TextField
                            label="Consultation fee"
                            type="number"
                            value={form.data.consultation_fee}
                            error={form.errors.consultation_fee}
                            required
                            onChange={(value) =>
                                form.setData('consultation_fee', value)
                            }
                        />
                    </Section>

                    <Section title="Clinic schedule">
                        <TextAreaField
                            label="Schedule"
                            value={form.data.schedule}
                            error={form.errors.schedule}
                            required
                            className="lg:col-span-4"
                            onChange={(value) =>
                                form.setData('schedule', value)
                            }
                        />
                    </Section>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            Save doctor
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
                min={type === 'number' ? '0' : undefined}
                step={type === 'number' ? '0.01' : undefined}
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
    options,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    options: [string, string][];
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
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

