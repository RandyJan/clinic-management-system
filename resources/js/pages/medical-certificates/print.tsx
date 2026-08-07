import { Head } from '@inertiajs/react';
import { MedicalCertificate } from './types';

export default function MedicalCertificatePrint({
    certificate,
}: {
    certificate: MedicalCertificate;
}) {
    return (
        <>
            <Head title={`Print ${certificate.certificate_number}`} />
            <main className="mx-auto grid min-h-screen max-w-3xl gap-8 bg-white p-10 text-black print:min-h-0 print:p-0">
                <header className="text-center">
                    <h1 className="text-xl font-bold uppercase">
                        Medical Certificate
                    </h1>
                    <p className="text-sm">{certificate.certificate_number}</p>
                </header>

                <section className="grid gap-4 text-sm leading-7">
                    <p>
                        This is to certify that{' '}
                        <strong>{certificate.patient.full_name}</strong>,{' '}
                        {certificate.patient.age ?? 'N/A'} years old, was seen
                        and evaluated under consultation{' '}
                        <strong>
                            {certificate.consultation.consultation_number}
                        </strong>
                        .
                    </p>
                    <p>
                        Diagnosis: <strong>{certificate.diagnosis}</strong>
                    </p>
                    <p>Recommendation: {certificate.recommendation}</p>
                    {certificate.rest_days !== null && (
                        <p>
                            Recommended rest period: {certificate.rest_days}{' '}
                            day(s).
                        </p>
                    )}
                    {certificate.remarks && <p>Remarks: {certificate.remarks}</p>}
                    <p>
                        Issued on {certificate.issued_date} upon request for
                        whatever legal purpose it may serve.
                    </p>
                </section>

                <footer className="mt-12 grid justify-end text-center text-sm">
                    <div className="border-t border-black px-8 pt-2">
                        <p className="font-semibold">
                            Dr. {certificate.doctor.full_name}
                        </p>
                        <p>{certificate.doctor.specialization}</p>
                        <p>License No. {certificate.doctor.license_number}</p>
                    </div>
                </footer>
            </main>
        </>
    );
}
