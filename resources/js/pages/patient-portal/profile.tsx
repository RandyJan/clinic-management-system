import PatientPortalController from '@/actions/App/Http/Controllers/PatientPortalController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { FormEvent } from 'react';
import { formatDate, PortalHeader, StatusBadge } from './partials';
import { PortalProfileProps } from './types';

type ProfileContactForm = {
    contact_number: string;
    email: string;
    address: string;
    emergency_contact_name: string;
    emergency_contact_number: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patient Portal', href: PatientPortalController.dashboard().url },
    { title: 'My Profile', href: PatientPortalController.profile().url },
];

export default function PatientPortalProfile({ patient }: PortalProfileProps) {
    const form = useForm<ProfileContactForm>({
        contact_number: patient.contact_number,
        email: patient.email ?? '',
        address: patient.address ?? '',
        emergency_contact_name: patient.emergency_contact_name ?? '',
        emergency_contact_number: patient.emergency_contact_number ?? '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(PatientPortalController.updateProfile().url, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <PortalHeader
                    title="My profile"
                    description="You can update contact information only."
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.45fr)_minmax(0,1fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm">
                            <ProfileRow
                                label="Patient code"
                                value={patient.patient_code}
                            />
                            <ProfileRow
                                label="Name"
                                value={patient.full_name}
                            />
                            <ProfileRow label="Gender" value={patient.gender} />
                            <ProfileRow
                                label="Birthdate"
                                value={formatDate(patient.birthdate)}
                            />
                            <ProfileRow
                                label="Age"
                                value={patient.age?.toString() ?? 'Not set'}
                            />
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">
                                    Status
                                </span>
                                <StatusBadge status={patient.status} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={submit}
                                className="grid gap-4 md:grid-cols-2"
                            >
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
                                    onChange={(value) =>
                                        form.setData('email', value)
                                    }
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
                                        form.setData(
                                            'emergency_contact_name',
                                            value,
                                        )
                                    }
                                />
                                <TextField
                                    label="Emergency contact number"
                                    value={form.data.emergency_contact_number}
                                    error={form.errors.emergency_contact_number}
                                    onChange={(value) =>
                                        form.setData(
                                            'emergency_contact_number',
                                            value,
                                        )
                                    }
                                />
                                <div className="flex justify-end md:col-span-2">
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                    >
                                        <Save />
                                        Save contact information
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium capitalize">{value}</span>
        </div>
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
