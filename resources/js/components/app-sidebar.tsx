import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as appointmentsIndex } from '@/routes/appointments';
import { index as auditsIndex } from '@/routes/audits';
import { index as doctorsIndex } from '@/routes/doctors';
import { index as laboratoryRequestsIndex } from '@/routes/laboratory-requests';
import { index as medicalRecordsIndex } from '@/routes/medical-records';
import { index as patientsIndex } from '@/routes/patients';
import { index as prescriptionsIndex } from '@/routes/prescriptions';
import { index as queuesIndex } from '@/routes/queues';
import { index as rolesIndex } from '@/routes/roles';
import { index as usersIndex } from '@/routes/users';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ClipboardList,
    FileText,
    FlaskConical,
    LayoutGrid,
    ListOrdered,
    Pill,
    ShieldCheck,
    Stethoscope,
    UserRound,
    UsersRound,
} from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const can = (permission: string) => permissions.has(permission);

    const mainNavItems: NavItem[] = [
        ...(can('dashboard.view')
            ? [
                  {
                      title: 'Dashboard',
                      href: dashboard(),
                      icon: LayoutGrid,
                  },
              ]
            : []),
        ...(can('users.view')
            ? [
                  {
                      title: 'User Management',
                      href: usersIndex(),
                      icon: UsersRound,
                  },
              ]
            : []),
        ...(can('patients.view')
            ? [
                  {
                      title: 'Patients',
                      href: patientsIndex(),
                      icon: UserRound,
                  },
              ]
            : []),
        ...(can('medical-records.view') ||
        can('medical-records.assigned.view') ||
        can('medical-records.own.view')
            ? [
                  {
                      title: 'Medical Records',
                      href: medicalRecordsIndex(),
                      icon: ClipboardList,
                  },
              ]
            : []),
        ...(can('doctors.view')
            ? [
                  {
                      title: 'Doctors',
                      href: doctorsIndex(),
                      icon: Stethoscope,
                  },
              ]
            : []),
        ...(can('appointments.own.view')
            ? [
                  {
                      title: 'Appointments',
                      href: appointmentsIndex(),
                      icon: CalendarDays,
                  },
              ]
            : []),
        ...(can('prescriptions.view') ||
        can('prescriptions.doctor.view') ||
        can('prescriptions.own.view')
            ? [
                  {
                      title: 'Prescriptions',
                      href: prescriptionsIndex(),
                      icon: Pill,
                  },
              ]
            : []),
        ...(can('laboratory-requests.view') ||
        can('laboratory-requests.doctor.view') ||
        can('laboratory-requests.own.view')
            ? [
                  {
                      title: 'Laboratory',
                      href: laboratoryRequestsIndex(),
                      icon: FlaskConical,
                  },
              ]
            : []),
        ...(can('queues.view')
            ? [
                  {
                      title: 'Queue',
                      href: queuesIndex(),
                      icon: ListOrdered,
                  },
              ]
            : []),
        ...(can('roles.view')
            ? [
                  {
                      title: 'Role Management',
                      href: rolesIndex(),
                      icon: ShieldCheck,
                  },
              ]
            : []),
        ...(can('audits.view')
            ? [
                  {
                      title: 'Audit Logs',
                      href: auditsIndex(),
                      icon: FileText,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
