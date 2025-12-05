'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserActivity, ActivityItem } from '@/app/profile/actions';
import ActivityItemComponent from '@/components/ActivityItem';
import { Loader2 } from 'lucide-react';

interface ActivityFeedProps {
    userId: string;
}

export default function ActivityFeed({ userId }: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadActivities();
    }, [userId]);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const data = await getUserActivity(userId, limit, 0);
            setActivities(data);
            setHasMore(data.length === limit);
            setOffset(limit);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const data = await getUserActivity(userId, limit, offset);
            setActivities([...activities, ...data]);
            setHasMore(data.length === limit);
            setOffset(offset + limit);
        } catch (error) {
            console.error('Error loading more activities:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading activity...</p>
                </CardContent>
            </Card>
        );
    }

    if (activities.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <p>No activity yet</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity) => (
                <ActivityItemComponent key={activity.id} activity={activity} />
            ))}

            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
