import MedicalCertificateController from '@/actions/App/Http/Controllers/MedicalCertificateController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';
import { CertificateConsultation } from './types';

type CertificateFormData = {
    patient_id: number;
    consultation_id: number;
    doctor_id: number;
    diagnosis: string;
    recommendation: string;
    rest_days: string;
    issued_date: string;
    remarks: string;
};

export default function CreateMedicalCertificate({
    consultation,
}: {
    consultation: CertificateConsultation;
}) {
    const form = useForm<CertificateFormData>({
        patient_id: consultation.patient_id ?? 0,
        consultation_id: consultation.id,
        doctor_id: consultation.doctor_id ?? 0,
        diagnosis: consultation.diagnosis ?? '',
        recommendation: '',
        rest_days: '',
        issued_date: new Date().toISOString().slice(0, 10),
        remarks: '',
    });
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Consultation',
            href: MedicalCertificateController.create(consultation.id).url,
        },
        {
            title: 'Create Medical Certificate',
            href: MedicalCertificateController.create(consultation.id).url,
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(MedicalCertificateController.store().url, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create medical certificate" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Create medical certificate
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {consultation.consultation_number} ·{' '}
                        {consultation.patient?.full_name} · Dr.{' '}
                        {consultation.doctor?.full_name}
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Issued date" error={form.errors.issued_date}>
                            <Input
                                type="date"
                                value={form.data.issued_date}
                                onChange={(event) =>
                                    form.setData(
                                        'issued_date',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label="Rest days" error={form.errors.rest_days}>
                            <Input
                                type="number"
                                min="0"
                                value={form.data.rest_days}
                                onChange={(event) =>
                                    form.setData('rest_days', event.target.value)
                                }
                            />
                        </Field>
                    </div>
                    <Field label="Diagnosis" error={form.errors.diagnosis}>
                        <Textarea
                            value={form.data.diagnosis}
                            onChange={(event) =>
                                form.setData('diagnosis', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="Recommendation"
                        error={form.errors.recommendation}
                    >
                        <Textarea
                            value={form.data.recommendation}
                            onChange={(event) =>
                                form.setData(
                                    'recommendation',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    <Field label="Remarks" error={form.errors.remarks}>
                        <Textarea
                            value={form.data.remarks}
                            onChange={(event) =>
                                form.setData('remarks', event.target.value)
                            }
                        />
                    </Field>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Issuing...' : 'Issue certificate'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
