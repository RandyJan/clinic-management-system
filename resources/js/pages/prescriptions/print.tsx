import PrescriptionController from '@/actions/App/Http/Controllers/PrescriptionController';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { PrescriptionDetail } from './types';

export default function PrescriptionPrint({
    prescription,
}: {
    prescription: PrescriptionDetail;
}) {
    return (
        <>
            <Head
                title={`${prescription.prescription_number} printable prescription`}
            />
            <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 bg-white p-8 text-black print:max-w-none print:p-0">
                <div className="flex justify-between gap-3 print:hidden">
                    <Button variant="outline" asChild>
                        <Link
                            href={
                                PrescriptionController.show(prescription.id).url
                            }
                        >
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer />
                        Print prescription
                    </Button>
                </div>
                <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-5">
                    <div>
                        <p className="text-sm font-semibold tracking-[0.2em] uppercase">
                            Clinic Management System
                        </p>
                        <h1 className="mt-1 text-3xl font-bold">
                            Prescription
                        </h1>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">
                            {prescription.prescription_number}
                        </p>
                        <p className="text-sm">
                            {new Intl.DateTimeFormat(undefined, {
                                dateStyle: 'long',
                            }).format(new Date(prescription.created_at ?? 0))}
                        </p>
                    </div>
                </header>
                <section className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase">
                            Patient
                        </p>
                        <p className="mt-1 text-lg font-bold">
                            {prescription.patient.full_name}
                        </p>
                        <p>{prescription.patient.patient_code}</p>
                        <p>{prescription.patient.address}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase">
                            Prescriber
                        </p>
                        <p className="mt-1 text-lg font-bold">
                            Dr. {prescription.doctor.full_name}
                        </p>
                        <p>{prescription.doctor.specialization}</p>
                        <p>License: {prescription.doctor.license_number}</p>
                    </div>
                </section>
                <section>
                    <div className="mb-4 flex items-center gap-3">
                        <span className="font-serif text-5xl">℞</span>
                        <div>
                            <p className="font-semibold">Diagnosis</p>
                            <p className="text-sm">
                                {prescription.consultation.diagnosis ??
                                    'Not recorded'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-5">
                        {prescription.items.map((item, index) => (
                            <article
                                key={item.id}
                                className="break-inside-avoid border-b pb-4"
                            >
                                <div className="flex gap-3">
                                    <span className="font-bold">
                                        {index + 1}.
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-lg font-bold">
                                            {item.medicine_name}
                                        </p>
                                        <p>
                                            {item.dosage} · {item.frequency} ·{' '}
                                            {item.duration}
                                        </p>
                                        <p className="mt-1 text-sm">
                                            Quantity: {item.quantity}{' '}
                                            {item.unit ?? 'unit(s)'}
                                        </p>
                                        {item.instructions && (
                                            <p className="mt-2 text-sm italic">
                                                {item.instructions}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
                {prescription.notes && (
                    <section className="break-inside-avoid rounded border border-black p-4">
                        <p className="text-xs font-semibold uppercase">Notes</p>
                        <p className="mt-2 text-sm whitespace-pre-wrap">
                            {prescription.notes}
                        </p>
                    </section>
                )}
                <footer className="mt-auto grid grid-cols-2 gap-12 pt-16 text-sm">
                    <div>
                        <div className="border-t border-black pt-2">
                            Patient / representative signature
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-black pt-2">
                            <p className="font-bold">
                                Dr. {prescription.doctor.full_name}
                            </p>
                            <p>{prescription.doctor.license_number}</p>
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
}
