'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { toggleFollow } from '@/app/profile/actions';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface FollowButtonProps {
    targetUserId: string;
    initialIsFollowing: boolean;
    onToggle?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetUserId, initialIsFollowing, onToggle }: FollowButtonProps) {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        if (!user) {
            toast.error('Please log in to follow users');
            return;
        }

        const newState = !isFollowing;
        setIsFollowing(newState);
        if (onToggle) onToggle(newState);

        startTransition(async () => {
            try {
                await toggleFollow(targetUserId);
            } catch (error) {
                // Revert on error
                setIsFollowing(!newState);
                if (onToggle) onToggle(!newState);
                toast.error('Failed to update follow status');
            }
        });
    };

    if (user?.id === targetUserId) return null;

    return (
        <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={isPending}
            className={isFollowing ? "text-muted-foreground hover:text-destructive hover:border-destructive" : ""}
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isFollowing ? (
                <UserMinus className="h-4 w-4 mr-2" />
            ) : (
                <UserPlus className="h-4 w-4 mr-2" />
            )}
            {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
    );
}
