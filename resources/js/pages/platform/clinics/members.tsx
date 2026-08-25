import PlatformClinicController from '@/actions/App/Http/Controllers/Platform/ClinicController';
import ClinicMembershipController from '@/actions/App/Http/Controllers/Platform/ClinicMembershipController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Trash2, UserPlus, UsersRound } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import {
    type Clinic,
    type ClinicMembership,
    type ClinicStatus,
    type MembershipOption,
    type MembershipUser,
} from './types';

type MembershipForm = {
    user_id: string;
    role_id: string;
    status: ClinicStatus;
};

export default function ClinicMembers({
    managedClinic,
    memberships,
    availableUsers,
    roles,
}: {
    managedClinic: Clinic;
    memberships: ClinicMembership[];
    availableUsers: MembershipUser[];
    roles: MembershipOption[];
}) {
    const form = useForm<MembershipForm>({
        user_id: '',
        role_id: '',
        status: 'active',
    });
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clinics', href: PlatformClinicController.index().url },
        {
            title: managedClinic.name,
            href: ClinicMembershipController.index(managedClinic.id).url,
        },
        {
            title: 'Members',
            href: ClinicMembershipController.index(managedClinic.id).url,
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(ClinicMembershipController.store(managedClinic.id).url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${managedClinic.name} Members`} />
            <div className="flex flex-1 flex-col gap-5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <UsersRound className="size-6 text-primary" />
                            <h1 className="text-2xl font-semibold">
                                Clinic Members
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage global user access to {managedClinic.name}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={PlatformClinicController.index()}>
                            <ArrowLeft />
                            Back to clinics
                        </Link>
                    </Button>
                </div>
                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,220px)_160px_auto] md:items-end"
                >
                    <div className="grid gap-2">
                        <Label>User</Label>
                        <Select
                            value={form.data.user_id}
                            onValueChange={(value) =>
                                form.setData('user_id', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a global user" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers.map((user) => (
                                    <SelectItem
                                        key={user.id}
                                        value={user.id.toString()}
                                    >
                                        {user.name} (
                                        {user.email ??
                                            user.username ??
                                            'No login'}
                                        )
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.user_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Clinic role</Label>
                        <Select
                            value={form.data.role_id}
                            onValueChange={(value) =>
                                form.setData('role_id', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem
                                        key={role.id}
                                        value={role.id.toString()}
                                    >
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.role_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                            value={form.data.status}
                            onValueChange={(value) =>
                                form.setData('status', value as ClinicStatus)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="submit"
                        disabled={
                            form.processing || availableUsers.length === 0
                        }
                    >
                        <UserPlus />
                        Add member
                    </Button>
                </form>
                <div className="overflow-hidden rounded-lg border border-sidebar-border/70">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Clinic role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {memberships.map((membership) => (
                                <MembershipRow
                                    key={membership.id}
                                    managedClinic={managedClinic}
                                    membership={membership}
                                    roles={roles}
                                />
                            ))}
                            {memberships.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No users have been assigned to this
                                        clinic.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                    Removing a membership revokes clinic access but keeps the
                    global user account.
                </p>
            </div>
        </AppLayout>
    );
}

function MembershipRow({
    managedClinic,
    membership,
    roles,
}: {
    managedClinic: Clinic;
    membership: ClinicMembership;
    roles: MembershipOption[];
}) {
    const [roleId, setRoleId] = useState(membership.role_id.toString());
    const [status, setStatus] = useState<ClinicStatus>(membership.status);
    const [processing, setProcessing] = useState(false);

    function save() {
        router.patch(
            ClinicMembershipController.update({
                clinic: managedClinic.id,
                membership: membership.id,
            }).url,
            { role_id: Number(roleId), status },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function remove() {
        if (
            !window.confirm(
                `Remove ${membership.user.name} from ${managedClinic.name}?`,
            )
        )
            return;
        router.delete(
            ClinicMembershipController.destroy({
                clinic: managedClinic.id,
                membership: membership.id,
            }).url,
            { preserveScroll: true },
        );
    }

    return (
        <TableRow>
            <TableCell>
                <p className="font-medium">{membership.user.name}</p>
                <p className="text-sm text-muted-foreground">
                    {membership.user.email ??
                        membership.user.username ??
                        'No login identifier'}
                </p>
            </TableCell>
            <TableCell>
                <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map((role) => (
                            <SelectItem
                                key={role.id}
                                value={role.id.toString()}
                            >
                                {role.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Select
                        value={status}
                        onValueChange={(value) =>
                            setStatus(value as ClinicStatus)
                        }
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Badge
                        variant={status === 'active' ? 'default' : 'secondary'}
                    >
                        {status}
                    </Badge>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={processing}
                        onClick={save}
                    >
                        <Save />
                        Save
                    </Button>
                    <Button
                        size="icon-sm"
                        variant="destructive"
                        aria-label={`Remove ${membership.user.name}`}
                        onClick={remove}
                    >
                        <Trash2 />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
