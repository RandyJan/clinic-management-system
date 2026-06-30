import ConsultationController from '@/actions/App/Http/Controllers/ConsultationController';
import LaboratoryRequestController from '@/actions/App/Http/Controllers/LaboratoryRequestController';
import PatientController from '@/actions/App/Http/Controllers/PatientController';
import PrescriptionController from '@/actions/App/Http/Controllers/PrescriptionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { show as appointmentShow } from '@/routes/appointments';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Beaker,
    ClipboardCheck,
    FileClock,
    Pill,
    Save,
} from 'lucide-react';
import { FormEvent } from 'react';
import {
    ConsultationFormData,
    ConsultationHistoryItem,
    ConsultationRecord,
} from './types';

export default function ConsultationForm({
    consultation,
    medical_history,
}: {
    consultation: ConsultationRecord;
    medical_history: ConsultationHistoryItem[];
}) {
    const permissions = new Set(
        usePage<SharedData>().props.auth.permissions ?? [],
    );
    const prescription = consultation.prescriptions[0] ?? null;
    const laboratoryRequest = consultation.laboratory_requests[0] ?? null;
    const form = useForm<ConsultationFormData>({
        chief_complaint: consultation.chief_complaint ?? '',
        history_of_present_illness:
            consultation.history_of_present_illness ?? '',
        diagnosis: consultation.diagnosis ?? '',
        treatment_plan: consultation.treatment_plan ?? '',
        doctor_notes: consultation.doctor_notes ?? '',
        follow_up_date: consultation.follow_up_date ?? '',
        prescription_medications: prescription?.medications ?? '',
        prescription_instructions: prescription?.instructions ?? '',
        laboratory_tests: laboratoryRequest?.tests ?? '',
        laboratory_instructions: laboratoryRequest?.instructions ?? '',
    });
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Appointments',
            href: appointmentShow(consultation.appointment_id).url,
        },
        {
            title: consultation.consultation_number,
            href: ConsultationController.edit(consultation.id).url,
        },
    ];

    function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put(ConsultationController.update(consultation.id).url, {
            preserveScroll: true,
        });
    }

    function complete() {
        form.patch(ConsultationController.complete(consultation.id).url, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={consultation.consultation_number} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="grid gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link
                                href={
                                    appointmentShow(consultation.appointment_id)
                                        .url
                                }
                            >
                                <ArrowLeft />
                                Appointment
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {consultation.consultation_number}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {consultation.patient.full_name} - Dr.{' '}
                                {consultation.doctor.full_name}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {permissions.has('prescriptions.create') && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={
                                        PrescriptionController.create(
                                            consultation.id,
                                        ).url
                                    }
                                >
                                    <Pill />
                                    Create prescription
                                </Link>
                            </Button>
                        )}
                        {permissions.has('laboratory-requests.create') && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={
                                        LaboratoryRequestController.create(
                                            consultation.id,
                                        ).url
                                    }
                                >
                                    <Beaker />
                                    Create lab request
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link
                                href={
                                    PatientController.history(
                                        consultation.patient_id,
                                    ).url
                                }
                            >
                                <FileClock />
                                Medical record
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={complete}
                            disabled={form.processing}
                        >
                            <ClipboardCheck />
                            Complete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <form
                        onSubmit={save}
                        className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                    >
                        <div className="grid gap-4">
                            <TextAreaField
                                label="Chief complaint"
                                value={form.data.chief_complaint}
                                error={form.errors.chief_complaint}
                                onChange={(value) =>
                                    form.setData('chief_complaint', value)
                                }
                            />
                            <TextAreaField
                                label="History of present illness"
                                value={form.data.history_of_present_illness}
                                error={form.errors.history_of_present_illness}
                                onChange={(value) =>
                                    form.setData(
                                        'history_of_present_illness',
                                        value,
                                    )
                                }
                            />
                            <TextAreaField
                                label="Diagnosis"
                                value={form.data.diagnosis}
                                error={form.errors.diagnosis}
                                onChange={(value) =>
                                    form.setData('diagnosis', value)
                                }
                            />
                            <TextAreaField
                                label="Treatment plan"
                                value={form.data.treatment_plan}
                                error={form.errors.treatment_plan}
                                onChange={(value) =>
                                    form.setData('treatment_plan', value)
                                }
                            />
                            <TextAreaField
                                label="Doctor notes"
                                value={form.data.doctor_notes}
                                error={form.errors.doctor_notes}
                                onChange={(value) =>
                                    form.setData('doctor_notes', value)
                                }
                            />
                            <div className="grid gap-2 md:max-w-xs">
                                <Label htmlFor="follow_up_date">
                                    Follow-up date
                                </Label>
                                <Input
                                    id="follow_up_date"
                                    type="date"
                                    value={form.data.follow_up_date}
                                    onChange={(event) =>
                                        form.setData(
                                            'follow_up_date',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.follow_up_date}
                                />
                            </div>
                        </div>

                        <section className="grid gap-3 rounded-md border p-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <Pill className="size-4" />
                                Prescription
                            </div>
                            <TextAreaField
                                label="Medications"
                                value={form.data.prescription_medications}
                                error={form.errors.prescription_medications}
                                onChange={(value) =>
                                    form.setData(
                                        'prescription_medications',
                                        value,
                                    )
                                }
                            />
                            <TextAreaField
                                label="Instructions"
                                value={form.data.prescription_instructions}
                                error={form.errors.prescription_instructions}
                                onChange={(value) =>
                                    form.setData(
                                        'prescription_instructions',
                                        value,
                                    )
                                }
                            />
                        </section>

                        <section className="grid gap-3 rounded-md border p-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <Beaker className="size-4" />
                                Laboratory request
                            </div>
                            <TextAreaField
                                label="Tests"
                                value={form.data.laboratory_tests}
                                error={form.errors.laboratory_tests}
                                onChange={(value) =>
                                    form.setData('laboratory_tests', value)
                                }
                            />
                            <TextAreaField
                                label="Instructions"
                                value={form.data.laboratory_instructions}
                                error={form.errors.laboratory_instructions}
                                onChange={(value) =>
                                    form.setData(
                                        'laboratory_instructions',
                                        value,
                                    )
                                }
                            />
                        </section>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing}>
                                <Save />
                                Save consultation
                            </Button>
                        </div>
                    </form>

                    <aside className="grid content-start gap-4">
                        <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                            <h2 className="font-semibold">Appointment</h2>
                            <Detail
                                label="Number"
                                value={
                                    consultation.appointment.appointment_number
                                }
                            />
                            <Detail
                                label="Schedule"
                                value={`${consultation.appointment.appointment_date} ${consultation.appointment.appointment_time}`}
                            />
                            <Detail
                                label="Status"
                                value={consultation.status}
                            />
                        </section>
                        <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                            <h2 className="font-semibold">Patient history</h2>
                            {medical_history.length === 0 ? (
                                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                    No completed consultations yet.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {medical_history.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={
                                                ConsultationController.show(
                                                    item.id,
                                                ).url
                                            }
                                            className="grid gap-1 rounded-md border p-3 text-sm transition hover:bg-muted"
                                        >
                                            <span className="font-medium">
                                                {item.consultation_number}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {item.diagnosis ??
                                                    'No diagnosis recorded'}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

function TextAreaField({
    label,
    value,
    error,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    const id = label.toLowerCase().replaceAll(' ', '-');

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Textarea
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1">
            <div className="text-xs font-medium text-muted-foreground">
                {label}
            </div>
            <div className="text-sm">{value}</div>
        </div>
    );
}
