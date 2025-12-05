'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import FollowButton from './FollowButton';

interface User {
    id: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    is_following?: boolean;
}

interface UserListProps {
    users: User[];
    emptyMessage?: string;
}

export default function UserList({ users, emptyMessage = 'No users found' }: UserListProps) {
    if (users.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar>
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{user.display_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{user.display_name || 'Anonymous'}</p>
                            {user.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                            )}
                        </div>
                    </Link>
                    <FollowButton
                        targetUserId={user.id}
                        initialIsFollowing={!!user.is_following}
                    />
                </div>
            ))}
        </div>
    );
}
