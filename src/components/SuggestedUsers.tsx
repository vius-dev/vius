'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import FollowButton from './FollowButton';
import { getSuggestedUsers } from '@/app/profile/actions';
import { Loader2 } from 'lucide-react';

interface SuggestedUser {
    id: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
}

export default function SuggestedUsers() {
    const [users, setUsers] = useState<SuggestedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getSuggestedUsers();
                setUsers(data || []);
            } catch (error) {
                console.error('Failed to fetch suggested users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (users.length === 0) return null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Who to follow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                        <Link href={`/profile/${user.id}`} className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>{user.display_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="truncate">
                                <p className="text-sm font-medium truncate">
                                    {user.display_name || 'Anonymous'}
                                </p>
                            </div>
                        </Link>
                        <FollowButton
                            targetUserId={user.id}
                            initialIsFollowing={false}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
