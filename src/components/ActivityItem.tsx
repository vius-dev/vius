'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, Bookmark, Clock } from 'lucide-react';
import { ActivityItem } from '@/app/profile/actions';
import { useRouter } from 'next/navigation';

interface ActivityItemProps {
    activity: ActivityItem;
}

export default function ActivityItemComponent({ activity }: ActivityItemProps) {
    const router = useRouter();

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderActivityContent = () => {
        switch (activity.type) {
            case 'article':
                return (
                    <div
                        className="space-y-2 cursor-pointer hover:bg-muted/50 -m-6 p-6 rounded-lg transition-colors"
                        onClick={() => router.push(`/article/${activity.data.id}`)}
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium">Published an article</span>
                            <Badge variant="secondary" className="ml-auto">
                                {activity.data.section}
                            </Badge>
                        </div>
                        <h3 className="text-lg font-semibold">{activity.data.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {activity.data.body.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(activity.timestamp)}
                        </div>
                    </div>
                );

            case 'comment':
                return (
                    <div
                        className="space-y-2 cursor-pointer hover:bg-muted/50 -m-6 p-6 rounded-lg transition-colors"
                        onClick={() => router.push(`/article/${activity.data.articles?.id}`)}
                    >
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Commented on</span>
                            <Badge variant="outline" className="ml-auto">
                                {activity.data.articles?.title}
                            </Badge>
                        </div>
                        <p className="text-foreground">{activity.data.text}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(activity.timestamp)}
                        </div>
                    </div>
                );

            case 'bookmark':
                return (
                    <div
                        className="space-y-2 cursor-pointer hover:bg-muted/50 -m-6 p-6 rounded-lg transition-colors"
                        onClick={() => router.push(`/article/${activity.data.articles?.id}`)}
                    >
                        <div className="flex items-center gap-2">
                            <Bookmark className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Bookmarked an article</span>
                            <Badge variant="secondary" className="ml-auto">
                                {activity.data.articles?.section}
                            </Badge>
                        </div>
                        <h3 className="text-lg font-semibold">{activity.data.articles?.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(activity.timestamp)}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Card>
            <CardContent className="pt-6">
                {renderActivityContent()}
            </CardContent>
        </Card>
    );
}
