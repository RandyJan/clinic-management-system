import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const page = usePage();
    const currentPath = normalizePath(page.url);
    const activePath = groups
        .flatMap((group) => group.items)
        .map((item) => normalizePath(resolveUrl(item.href)))
        .filter(
            (itemPath) =>
                currentPath === itemPath ||
                currentPath.startsWith(`${itemPath}/`),
        )
        .sort(
            (firstPath, secondPath) => secondPath.length - firstPath.length,
        )[0];

    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.title} className="px-2 py-1">
                    <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={
                                        normalizePath(resolveUrl(item.href)) ===
                                        activePath
                                    }
                                    tooltip={{ children: item.title }}
                                >
                                    <Link
                                        href={item.href}
                                        prefetch
                                        data-global-loader="module"
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}

function normalizePath(url: string): string {
    const path = url.split(/[?#]/, 1)[0].replace(/\/+$/, '');

    return path || '/';
}
