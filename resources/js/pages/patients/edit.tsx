import PatientFormPage from './form';
import { Patient } from './types';

export default function EditPatient({ patient }: { patient: Patient }) {
    return <PatientFormPage patient={patient} />;
}

