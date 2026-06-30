import LaboratoryRequestController from '@/actions/App/Http/Controllers/LaboratoryRequestController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { FormEvent } from 'react';
import { LabConsultation } from './types';

type LabRequestForm = {
    consultation_id: number;
    patient_id: number;
    doctor_id: number;
    requested_tests: string[];
    clinical_notes: string;
};

export default function CreateLabRequest({
    consultation,
}: {
    consultation: LabConsultation;
}) {
    const form = useForm<LabRequestForm>({
        consultation_id: consultation.id,
        patient_id: consultation.patient_id,
        doctor_id: consultation.doctor_id,
        requested_tests: [''],
        clinical_notes: '',
    });
    const errors = form.errors as Record<string, string>;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Laboratory', href: LaboratoryRequestController.index().url },
        {
            title: 'Create request',
            href: LaboratoryRequestController.create(consultation.id).url,
        },
    ];

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(LaboratoryRequestController.store().url, {
            preserveScroll: true,
        });
    }

    function updateTest(index: number, value: string) {
        form.setData(
            'requested_tests',
            form.data.requested_tests.map((test, testIndex) =>
                testIndex === index ? value : test,
            ),
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create laboratory request" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Create laboratory request
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {consultation.consultation_number} ·{' '}
                        {consultation.patient.full_name} · Dr.{' '}
                        {consultation.doctor.full_name}
                    </p>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <Detail
                                label="Patient"
                                value={`${consultation.patient.full_name} (${consultation.patient.patient_code})`}
                            />
                            <Detail
                                label="Doctor"
                                value={`Dr. ${consultation.doctor.full_name}`}
                            />
                            <Detail
                                label="Consultation"
                                value={consultation.consultation_number}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>Requested tests</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add every laboratory test required for this
                                    request.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    form.setData('requested_tests', [
                                        ...form.data.requested_tests,
                                        '',
                                    ])
                                }
                            >
                                <Plus />
                                Add test
                            </Button>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <InputError message={form.errors.requested_tests} />
                            {form.data.requested_tests.map((test, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-2"
                                >
                                    <div className="flex-1">
                                        <Label
                                            htmlFor={`test-${index}`}
                                            className="sr-only"
                                        >
                                            Test {index + 1}
                                        </Label>
                                        <Input
                                            id={`test-${index}`}
                                            value={test}
                                            placeholder="e.g. Complete blood count"
                                            onChange={(event) =>
                                                updateTest(
                                                    index,
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `requested_tests.${index}`
                                                ]
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={
                                            form.data.requested_tests.length ===
                                            1
                                        }
                                        onClick={() =>
                                            form.setData(
                                                'requested_tests',
                                                form.data.requested_tests.filter(
                                                    (_, testIndex) =>
                                                        testIndex !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 />
                                        <span className="sr-only">
                                            Remove test
                                        </span>
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Clinical notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Label htmlFor="clinical_notes" className="sr-only">
                                Clinical notes
                            </Label>
                            <Textarea
                                id="clinical_notes"
                                value={form.data.clinical_notes}
                                onChange={(event) =>
                                    form.setData(
                                        'clinical_notes',
                                        event.target.value,
                                    )
                                }
                                placeholder="Relevant symptoms, provisional diagnosis, or special instructions"
                                rows={5}
                            />
                            <InputError message={form.errors.clinical_notes} />
                        </CardContent>
                    </Card>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing
                                ? 'Creating…'
                                : 'Create lab request'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}
