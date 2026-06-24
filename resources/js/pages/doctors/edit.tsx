import DoctorFormPage from './form';
import { Doctor, UserOption } from './types';

export default function EditDoctor({
    doctor,
    users,
}: {
    doctor: Doctor;
    users: UserOption[];
}) {
    return <DoctorFormPage doctor={doctor} users={users} />;
}

