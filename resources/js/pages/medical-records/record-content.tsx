import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicalRecord } from './types';

const date = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
              new Date(value),
          )
        : 'Not recorded';

const value = (content: string | number | null | undefined, suffix = '') =>
    content === null || content === undefined || content === ''
        ? 'Not recorded'
        : `${content}${suffix}`;

function Empty() {
    return <p className="text-sm text-muted-foreground">No records found.</p>;
}

export function MedicalRecordContent({ record }: { record: MedicalRecord }) {
    const patient = record.patient;

    return (
        <div className="flex flex-col gap-6 print:gap-4">
            <Card className="break-inside-avoid print:shadow-none">
                <CardHeader>
                    <CardTitle>Patient information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['Patient code', patient.patient_code],
                        ['Full name', patient.full_name],
                        [
                            'Birthdate / age',
                            `${date(patient.birthdate)} / ${value(patient.age)}`,
                        ],
                        ['Gender', patient.gender],
                        ['Blood type', patient.blood_type],
                        ['Civil status', patient.civil_status],
                        ['Contact', patient.contact_number],
                        ['Email', patient.email],
                        ['Address', patient.address],
                        ['Emergency contact', patient.emergency_contact_name],
                        ['Emergency number', patient.emergency_contact_number],
                    ].map(([label, content]) => (
                        <div
                            key={label}
                            className={
                                label === 'Address' ? 'sm:col-span-2' : ''
                            }
                        >
                            <p className="text-muted-foreground">{label}</p>
                            <p className="font-medium capitalize">
                                {value(content)}
                            </p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-4">
                <TextCard title="Allergies" text={patient.allergies} />
                <TextCard
                    title="Existing conditions"
                    text={patient.existing_conditions}
                />
            </div>

            <Section title="Consultation history">
                {record.consultations.length === 0 ? (
                    <Empty />
                ) : (
                    record.consultations.map((item) => (
                        <article
                            key={item.id}
                            className="break-inside-avoid rounded-lg border p-4"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="font-semibold">
                                        {item.consultation_number}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {date(item.started_at)} · Dr.{' '}
                                        {item.doctor.full_name} ·{' '}
                                        {item.doctor.specialization}
                                    </p>
                                </div>
                                <Badge variant="secondary">{item.status}</Badge>
                            </div>
                            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                                <Detail
                                    label="Chief complaint"
                                    content={item.chief_complaint}
                                />
                                <Detail
                                    label="Diagnosis"
                                    content={item.diagnosis}
                                />
                                <Detail
                                    label="History of illness"
                                    content={item.history_of_present_illness}
                                />
                                <Detail
                                    label="Treatment plan"
                                    content={item.treatment_plan}
                                />
                                <Detail
                                    label="Doctor notes"
                                    content={item.doctor_notes}
                                />
                                <Detail
                                    label="Follow-up"
                                    content={
                                        item.follow_up_date
                                            ? date(item.follow_up_date)
                                            : null
                                    }
                                />
                            </div>
                        </article>
                    ))
                )}
            </Section>

            <Section title="Diagnoses">
                {record.diagnoses.length === 0 ? (
                    <Empty />
                ) : (
                    record.diagnoses.map((item) => (
                        <Row
                            key={`${item.consultation_number}-${item.diagnosis}`}
                            title={item.diagnosis}
                            meta={`${date(item.diagnosed_at)} · ${item.consultation_number} · Dr. ${item.doctor_name}`}
                        />
                    ))
                )}
            </Section>

            <Section title="Prescriptions">
                {record.prescriptions.length === 0 ? (
                    <Empty />
                ) : (
                    record.prescriptions.map((item) => (
                        <Row
                            key={item.id}
                            title={item.medications}
                            meta={`${date(item.prescribed_at)} · ${item.consultation_number} · Dr. ${item.doctor_name}`}
                            detail={item.instructions}
                        />
                    ))
                )}
            </Section>

            <Section title="Laboratory requests and results">
                {record.laboratory_requests.length === 0 ? (
                    <Empty />
                ) : (
                    record.laboratory_requests.map((item) => (
                        <article
                            key={item.id}
                            className="break-inside-avoid rounded-lg border p-4 text-sm"
                        >
                            <div className="flex flex-wrap justify-between gap-2">
                                <p className="font-semibold">{item.tests}</p>
                                <Badge variant="outline">{item.status}</Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Requested {date(item.requested_at)} ·{' '}
                                {item.consultation_number} · Dr.{' '}
                                {item.doctor_name}
                            </p>
                            <div className="mt-3 rounded-md bg-muted/50 p-3">
                                <p className="font-medium">
                                    Result{' '}
                                    {item.resulted_at
                                        ? `· ${date(item.resulted_at)}`
                                        : ''}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap">
                                    {value(item.result, ' ')}
                                </p>
                                {item.result_notes && (
                                    <p className="mt-2 text-muted-foreground">
                                        {item.result_notes}
                                    </p>
                                )}
                            </div>
                        </article>
                    ))
                )}
            </Section>

            <Section title="Vital signs history">
                {record.vital_signs.length === 0 ? (
                    <Empty />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-muted-foreground">
                                <tr>
                                    {[
                                        'Recorded',
                                        'BP',
                                        'Temp',
                                        'Pulse',
                                        'Resp.',
                                        'SpO2',
                                        'BMI',
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className="p-2 font-medium"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {record.vital_signs.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="break-inside-avoid border-b last:border-0"
                                    >
                                        <td className="p-2">
                                            {date(item.recorded_at)}
                                        </td>
                                        <td className="p-2">
                                            {value(item.blood_pressure)}
                                        </td>
                                        <td className="p-2">
                                            {value(item.temperature, ' °C')}
                                        </td>
                                        <td className="p-2">
                                            {value(item.pulse_rate)}
                                        </td>
                                        <td className="p-2">
                                            {value(item.respiratory_rate)}
                                        </td>
                                        <td className="p-2">
                                            {value(item.oxygen_saturation, '%')}
                                        </td>
                                        <td className="p-2">
                                            {value(item.bmi)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            <Section title="Follow-up history">
                {record.follow_ups.length === 0 ? (
                    <Empty />
                ) : (
                    record.follow_ups.map((item) => (
                        <Row
                            key={`${item.consultation_number}-${item.follow_up_date}`}
                            title={date(item.follow_up_date)}
                            meta={`${item.consultation_number} · Dr. ${item.doctor_name}`}
                            detail={item.treatment_plan}
                        />
                    ))
                )}
            </Section>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="print:shadow-none">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {children}
            </CardContent>
        </Card>
    );
}

function TextCard({ title, text }: { title: string; text: string | null }) {
    return (
        <Card className="break-inside-avoid print:shadow-none">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                    {text || 'None recorded.'}
                </p>
            </CardContent>
        </Card>
    );
}

function Detail({ label, content }: { label: string; content: string | null }) {
    return (
        <div>
            <p className="text-muted-foreground">{label}</p>
            <p className="whitespace-pre-wrap">{content || 'Not recorded'}</p>
        </div>
    );
}

function Row({
    title,
    meta,
    detail,
}: {
    title: string;
    meta: string;
    detail?: string | null;
}) {
    return (
        <article className="break-inside-avoid rounded-lg border p-4">
            <p className="font-medium whitespace-pre-wrap">{title}</p>
            <p className="text-sm text-muted-foreground">{meta}</p>
            {detail && (
                <p className="mt-2 text-sm whitespace-pre-wrap">{detail}</p>
            )}
        </article>
    );
}
