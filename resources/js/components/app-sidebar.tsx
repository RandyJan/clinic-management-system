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
import { index as auditsIndex } from '@/routes/audits';
import { index as doctorsIndex } from '@/routes/doctors';
import { index as patientsIndex } from '@/routes/patients';
import { index as queuesIndex } from '@/routes/queues';
import { index as rolesIndex } from '@/routes/roles';
import { index as usersIndex } from '@/routes/users';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    FileText,
    Folder,
    LayoutGrid,
    ListOrdered,
    Stethoscope,
    ShieldCheck,
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
        ...(can('doctors.view')
            ? [
                  {
                      title: 'Doctors',
                      href: doctorsIndex(),
                      icon: Stethoscope,
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
