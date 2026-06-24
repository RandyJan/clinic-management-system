import PatientController from '@/actions/App/Http/Controllers/PatientController';
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
import { index as patientsIndex } from '@/routes/patients';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type ReactNode } from 'react';
import { FormEvent } from 'react';
import { Patient, PatientFormData } from './types';

const emptyForm: PatientFormData = {
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    gender: '',
    birthdate: '',
    civil_status: '',
    contact_number: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    blood_type: '',
    allergies: '',
    existing_conditions: '',
};

export default function PatientFormPage({
    patient,
}: {
    patient?: Patient;
}) {
    const isEditing = patient !== undefined;
    const form = useForm<PatientFormData>(
        patient
            ? {
                  first_name: patient.first_name,
                  middle_name: patient.middle_name ?? '',
                  last_name: patient.last_name,
                  suffix: patient.suffix ?? '',
                  gender: patient.gender,
                  birthdate: patient.birthdate,
                  civil_status: patient.civil_status ?? '',
                  contact_number: patient.contact_number,
                  email: patient.email ?? '',
                  address: patient.address ?? '',
                  emergency_contact_name: patient.emergency_contact_name ?? '',
                  emergency_contact_number:
                      patient.emergency_contact_number ?? '',
                  blood_type: patient.blood_type ?? '',
                  allergies: patient.allergies ?? '',
                  existing_conditions: patient.existing_conditions ?? '',
              }
            : emptyForm,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Patients', href: patientsIndex().url },
        {
            title: isEditing ? 'Edit Patient' : 'Register Patient',
            href: isEditing
                ? PatientController.edit(patient.id).url
                : PatientController.create().url,
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (patient) {
            form.put(PatientController.update(patient.id).url, {
                preserveScroll: true,
            });

            return;
        }

        form.post(PatientController.store().url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Patient' : 'Register Patient'} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {isEditing ? 'Edit Patient' : 'Register Patient'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {patient?.patient_code ?? 'New patient record'}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={patientsIndex().url}>
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                </div>

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <Section title="Personal information">
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
                            label="Middle name"
                            value={form.data.middle_name}
                            error={form.errors.middle_name}
                            onChange={(value) =>
                                form.setData('middle_name', value)
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
                            label="Suffix"
                            value={form.data.suffix}
                            error={form.errors.suffix}
                            onChange={(value) => form.setData('suffix', value)}
                        />
                        <SelectField
                            label="Gender"
                            value={form.data.gender}
                            error={form.errors.gender}
                            required
                            options={[
                                ['female', 'Female'],
                                ['male', 'Male'],
                                ['other', 'Other'],
                            ]}
                            onChange={(value) => form.setData('gender', value)}
                        />
                        <TextField
                            label="Birthdate"
                            type="date"
                            value={form.data.birthdate}
                            error={form.errors.birthdate}
                            required
                            onChange={(value) =>
                                form.setData('birthdate', value)
                            }
                        />
                        <SelectField
                            label="Civil status"
                            value={form.data.civil_status}
                            error={form.errors.civil_status}
                            options={[
                                ['single', 'Single'],
                                ['married', 'Married'],
                                ['widowed', 'Widowed'],
                                ['separated', 'Separated'],
                            ]}
                            onChange={(value) =>
                                form.setData('civil_status', value)
                            }
                        />
                        <SelectField
                            label="Blood type"
                            value={form.data.blood_type}
                            error={form.errors.blood_type}
                            options={[
                                ['A+', 'A+'],
                                ['A-', 'A-'],
                                ['B+', 'B+'],
                                ['B-', 'B-'],
                                ['AB+', 'AB+'],
                                ['AB-', 'AB-'],
                                ['O+', 'O+'],
                                ['O-', 'O-'],
                            ]}
                            onChange={(value) =>
                                form.setData('blood_type', value)
                            }
                        />
                    </Section>

                    <Section title="Contact information">
                        <TextField
                            label="Contact number"
                            value={form.data.contact_number}
                            error={form.errors.contact_number}
                            required
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
                        <TextAreaField
                            label="Address"
                            value={form.data.address}
                            error={form.errors.address}
                            required
                            className="md:col-span-2"
                            onChange={(value) =>
                                form.setData('address', value)
                            }
                        />
                        <TextField
                            label="Emergency contact name"
                            value={form.data.emergency_contact_name}
                            error={form.errors.emergency_contact_name}
                            onChange={(value) =>
                                form.setData('emergency_contact_name', value)
                            }
                        />
                        <TextField
                            label="Emergency contact number"
                            value={form.data.emergency_contact_number}
                            error={form.errors.emergency_contact_number}
                            onChange={(value) =>
                                form.setData('emergency_contact_number', value)
                            }
                        />
                    </Section>

                    <Section title="Medical notes">
                        <TextAreaField
                            label="Allergies"
                            value={form.data.allergies}
                            error={form.errors.allergies}
                            onChange={(value) =>
                                form.setData('allergies', value)
                            }
                        />
                        <TextAreaField
                            label="Existing conditions"
                            value={form.data.existing_conditions}
                            error={form.errors.existing_conditions}
                            onChange={(value) =>
                                form.setData('existing_conditions', value)
                            }
                        />
                    </Section>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            Save patient
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
