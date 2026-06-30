import LaboratoryRequestController from '@/actions/App/Http/Controllers/LaboratoryRequestController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { FormEvent } from 'react';
import { LabRequestDetail } from './types';

export default function UploadLabResult({
    laboratory_request,
}: {
    laboratory_request: LabRequestDetail;
}) {
    const form = useForm<{
        result_details: string;
        remarks: string;
        attachment: File | null;
    }>({
        result_details: laboratory_request.result?.result_details ?? '',
        remarks: laboratory_request.result?.remarks ?? '',
        attachment: null,
    });
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Laboratory', href: LaboratoryRequestController.index().url },
        {
            title: laboratory_request.lab_request_number,
            href: LaboratoryRequestController.show(laboratory_request.id).url,
        },
        {
            title: 'Upload result',
            href: LaboratoryRequestController.upload(laboratory_request.id).url,
        },
    ];
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(
            LaboratoryRequestController.storeResult(laboratory_request.id).url,
            { forceFormData: true, preserveScroll: true },
        );
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`Upload ${laboratory_request.lab_request_number} result`}
            />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Upload laboratory result
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {laboratory_request.lab_request_number} ·{' '}
                        {laboratory_request.patient.full_name}
                    </p>
                </div>
                <form
                    onSubmit={submit}
                    className="flex max-w-4xl flex-col gap-6"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Requested tests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                                {laboratory_request.requested_tests.map(
                                    (test) => (
                                        <li key={test}>{test}</li>
                                    ),
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Result details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <div>
                                <Label htmlFor="result_details">
                                    Result details
                                </Label>
                                <Textarea
                                    id="result_details"
                                    rows={10}
                                    value={form.data.result_details}
                                    onChange={(event) =>
                                        form.setData(
                                            'result_details',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2"
                                    placeholder="Enter measurements, findings, reference ranges, and interpretation"
                                />
                                <InputError
                                    message={form.errors.result_details}
                                />
                            </div>
                            <div>
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    rows={4}
                                    value={form.data.remarks}
                                    onChange={(event) =>
                                        form.setData(
                                            'remarks',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2"
                                />
                                <InputError message={form.errors.remarks} />
                            </div>
                            <div>
                                <Label htmlFor="attachment">
                                    Attachment (optional)
                                </Label>
                                <Input
                                    id="attachment"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={(event) =>
                                        form.setData(
                                            'attachment',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="mt-2"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    PDF or image, up to 10 MB. Existing
                                    attachment is retained unless replaced.
                                </p>
                                <InputError message={form.errors.attachment} />
                            </div>
                            {form.progress && (
                                <div>
                                    <Progress
                                        value={form.progress.percentage}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Uploading {form.progress.percentage}%
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Upload />
                            {form.processing
                                ? 'Uploading…'
                                : 'Upload and complete request'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
