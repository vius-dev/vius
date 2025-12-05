'use client';

import { Notification } from '@/types/notification';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Heart, UserPlus, AtSign } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { markNotificationAsRead } from '@/app/notifications/actions';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
    notification: Notification;
    onRead: () => void;
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const router = useRouter();

    const getIcon = () => {
        switch (notification.type) {
            case 'comment_reply':
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'reaction':
                return <Heart className="h-4 w-4 text-red-500" />;
            case 'follow':
                return <UserPlus className="h-4 w-4 text-green-500" />;
            case 'mention':
                return <AtSign className="h-4 w-4 text-orange-500" />;
            default:
                return null;
        }
    };

    const getMessage = () => {
        const actorName = notification.actor?.display_name || 'Someone';
        switch (notification.type) {
            case 'comment_reply':
                return (
                    <span>
                        <span className="font-semibold">{actorName}</span> replied to your comment on{' '}
                        <span className="font-medium text-foreground">
                            {notification.resource?.title || 'an article'}
                        </span>
                    </span>
                );
            case 'reaction':
                return (
                    <span>
                        <span className="font-semibold">{actorName}</span> liked your article{' '}
                        <span className="font-medium text-foreground">
                            {notification.resource?.title || 'an article'}
                        </span>
                    </span>
                );
            case 'follow':
                return (
                    <span>
                        <span className="font-semibold">{actorName}</span> started following you
                    </span>
                );
            case 'mention':
                return (
                    <span>
                        <span className="font-semibold">{actorName}</span> mentioned you in a comment
                    </span>
                );
            default:
                return <span>New notification</span>;
        }
    };

    const handleClick = async () => {
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
            onRead();
        }

        if (notification.resource_type === 'article') {
            router.push(`/article/${notification.resource_id}`);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-0",
                !notification.read && "bg-muted/20"
            )}
        >
            <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={notification.actor?.avatar_url} />
                    <AvatarFallback>{notification.actor?.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                    {getIcon()}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground leading-snug">
                    {getMessage()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                </p>
            </div>
            {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
            )}
        </div>
    );
}
