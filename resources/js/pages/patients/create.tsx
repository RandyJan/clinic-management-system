import PatientFormPage from './form';

export default function CreatePatient({
    users,
}: {
    users?: Array<{ id: number; label: string; email: string | null }>;
}) {
    return <PatientFormPage users={users} />;
}
