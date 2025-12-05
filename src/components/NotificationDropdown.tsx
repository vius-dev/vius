'use client';

import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/notification';
import NotificationItem from './NotificationItem';
import { useAuth } from '@/context/AuthContext';
import { markAllNotificationsAsRead, getUnreadNotificationCount } from '@/app/notifications/actions';
import { Badge } from '@/components/ui/badge';

export default function NotificationDropdown() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            // Subscribe to real-time changes
            const channel = supabase
                .channel('notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => {
                        fetchUnreadCount();
                        if (open) fetchNotifications();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, open]);

    const fetchUnreadCount = async () => {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
    };

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor:actor_id(display_name, avatar_url),
                resource:resource_id(title)
            `) // Note: This assumes resource_id points to articles for now. 
            // For comments, we might need a more complex query or view.
            // Given the current schema, we'll join assuming it's an article 
            // or handle the resource data fetching differently if needed.
            // For simplicity in this iteration, let's fetch basic data.
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            // We need to manually fetch resource titles if the join above is insufficient 
            // due to dynamic resource types. 
            // However, Supabase joins work well if foreign keys exist.
            // Since resource_id is generic UUID without FK constraint in schema (polymorphic),
            // we might need to fetch article titles separately if the join fails.
            // Let's try to fetch article titles for now.

            // Actually, for the MVP, let's just fetch the notifications and 
            // if resource_type is article, we can fetch the title.

            const enrichedNotifications = await Promise.all(data.map(async (n: any) => {
                let resourceTitle = 'content';
                if (n.resource_type === 'article') {
                    const { data: article } = await supabase
                        .from('articles')
                        .select('title')
                        .eq('id', n.resource_id)
                        .single();
                    if (article) resourceTitle = article.title;
                }
                return {
                    ...n,
                    resource: { title: resourceTitle }
                };
            }));

            setNotifications(enrichedNotifications as Notification[]);
        }
        setLoading(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            fetchNotifications();
        }
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    if (!user) return null;

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllRead}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onRead={() => {
                                        setNotifications(prev =>
                                            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                                        );
                                        setUnreadCount(prev => Math.max(0, prev - 1));
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
