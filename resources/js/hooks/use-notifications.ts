import { useCallback, useEffect, useState } from 'react';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    notification_type?: string;
    action_url?: string | null;
    is_read: boolean;
    user_id: number;
    user_name: string;
    old_role?: string | null;
    new_role?: string | null;
    changed_by: string;
    read_at?: string | null;
    created_at: string;
}

function normalizeNotification(notification: any): Notification {
    const payload = notification?.data ?? notification;

    return {
        id: notification?.id ?? payload?.id ?? `${Date.now()}`,
        type: payload?.type ?? payload?.notification_type ?? 'System',
        title: payload?.title ?? 'Notification',
        message: payload?.message ?? 'System notification',
        notification_type:
            payload?.notification_type ?? payload?.type ?? 'System',
        action_url: payload?.action_url ?? null,
        is_read: payload?.is_read ?? Boolean(notification?.read_at),
        user_id: payload?.user_id ?? 0,
        user_name: payload?.user_name ?? '',
        old_role: payload?.old_role ?? null,
        new_role: payload?.new_role ?? null,
        changed_by: payload?.changed_by ?? '',
        read_at: notification?.read_at ?? null,
        created_at:
            notification?.created_at ??
            payload?.changed_at ??
            new Date().toISOString(),
    };
}

declare global {
    interface Window {
        Echo?: any;
        notificationUpdates?: ((notification: Notification) => void)[];
    }
}

export function useNotifications(userId?: number) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(() => {
        fetch('/notifications/latest')
            .then((res) => res.json())
            .then((data) => {
                const items = Array.isArray(data)
                    ? data
                    : (data.notifications ?? []);

                setNotifications(
                    items.map((n: any) => normalizeNotification(n)),
                );
                setUnreadCount(
                    Array.isArray(data)
                        ? items.filter(
                              (n: any) => !normalizeNotification(n).read_at,
                          ).length
                        : (data.unread_count ?? 0),
                );
            })
            .catch((error) => {
                console.error('Failed to load notifications:', error);
            });
    }, []);

    // Load initial notifications
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // Register callback for real-time notification updates
    useEffect(() => {
        if (!userId) {
            return;
        }

        const handleNewNotification = () => {
            loadNotifications();
        };

        // Store callback in window for global listener to call
        if (!window.notificationUpdates) {
            window.notificationUpdates = [];
        }
        window.notificationUpdates.push(handleNewNotification);

        // Cleanup
        return () => {
            window.notificationUpdates = window.notificationUpdates?.filter(
                (cb) => cb !== handleNewNotification,
            );
        };
    }, [loadNotifications, userId]);

    return {
        notifications,
        unreadCount,
        reload: loadNotifications,
    };
}
