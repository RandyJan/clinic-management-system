import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Notification, useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { Bell } from 'lucide-react';

interface NotificationCenterProps {
    userId: number;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
    const { notifications, unreadCount, reload } = useNotifications(userId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative inline-flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full p-0"
                            variant="destructive"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-96 overflow-hidden p-0"
            >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <h3 className="font-semibold">Notifications</h3>
                    <button
                        onClick={() =>
                            router.post(
                                '/notifications/read-all',
                                {},
                                {
                                    preserveScroll: true,
                                    onSuccess: reload,
                                },
                            )
                        }
                        className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                        Mark all as read
                    </button>
                </div>
                {notifications.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <ScrollArea className="h-96">
                        <div className="divide-y divide-border/60">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    reload={reload}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}
                <div className="border-t border-border/60 p-2 text-center">
                    <Link
                        href="/notifications"
                        className="text-sm text-primary hover:underline"
                    >
                        View all notifications
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NotificationItem({
    notification,
    reload,
}: {
    notification: Notification;
    reload: () => void;
}) {
    if (notification.type === 'role_changed') {
        return (
            <div
                onClick={() => {
                    if (!notification.read_at) {
                        router.post(
                            `/notifications/${notification.id}/read`,
                            {},
                            {
                                preserveScroll: true,
                                onSuccess: () => {
                                    if (notification.action_url) {
                                        router.visit(notification.action_url);
                                    } else {
                                        reload();
                                    }
                                },
                            },
                        );
                    } else if (notification.action_url) {
                        router.visit(notification.action_url);
                    }
                }}
                className={cn(
                    'cursor-pointer border-l-4 px-4 py-3 transition-colors',
                    notification.read_at
                        ? 'border-l-transparent bg-background/45'
                        : 'border-l-blue-500 bg-blue-50/80 dark:bg-blue-950/35',
                )}
            >
                <div className="space-y-1">
                    <p className="text-sm leading-snug font-medium">
                        {notification.title}
                    </p>
                    <p className="text-xs leading-snug text-muted-foreground">
                        {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatTime(notification.created_at)}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => {
                if (!notification.read_at) {
                    router.post(
                        `/notifications/${notification.id}/read`,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                if (notification.action_url) {
                                    router.visit(notification.action_url);
                                } else {
                                    reload();
                                }
                            },
                        },
                    );
                } else if (notification.action_url) {
                    router.visit(notification.action_url);
                }
            }}
            className={cn(
                'cursor-pointer border-l-4 px-4 py-3 transition-colors',
                notification.read_at
                    ? 'border-l-transparent bg-background/45'
                    : 'border-l-primary bg-primary/5',
            )}
        >
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-xs leading-snug text-muted-foreground">
                {notification.message}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
                {formatTime(notification.created_at)}
            </p>
        </div>
    );
}

function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}
