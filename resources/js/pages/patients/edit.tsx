import PatientFormPage from './form';
import { Patient } from './types';

export default function EditPatient({
    patient,
    users,
}: {
    patient: Patient;
    users?: Array<{ id: number; label: string; email: string | null }>;
}) {
    return <PatientFormPage patient={patient} users={users} />;
}
