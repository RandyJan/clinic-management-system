import DoctorFormPage from './form';
import { UserOption } from './types';

export default function CreateDoctor({ users }: { users: UserOption[] }) {
    return <DoctorFormPage users={users} />;
}

