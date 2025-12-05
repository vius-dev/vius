'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserX, UserCheck } from 'lucide-react';
import { blockUser, unblockUser } from '@/app/actions/blocking';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BlockButtonProps {
    userId: string;
    isBlocked?: boolean;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showLabel?: boolean;
}

export default function BlockButton({
    userId,
    isBlocked = false,
    variant = 'outline',
    size = 'sm',
    showLabel = true
}: BlockButtonProps) {
    const router = useRouter();
    const [blocked, setBlocked] = useState(isBlocked);
    const [loading, setLoading] = useState(false);

    const handleToggleBlock = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);
        try {
            if (blocked) {
                await unblockUser(userId);
                setBlocked(false);
                toast.success('User unblocked');
            } else {
                await blockUser(userId);
                setBlocked(true);
                toast.success('User blocked');
            }
            router.refresh();
        } catch (error) {
            console.error('Error toggling block:', error);
            toast.error('Failed to update block status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleToggleBlock}
            disabled={loading}
            className={blocked ? 'text-destructive' : ''}
        >
            {blocked ? (
                <>
                    <UserCheck className="h-4 w-4" />
                    {showLabel && <span className="ml-2">Unblock</span>}
                </>
            ) : (
                <>
                    <UserX className="h-4 w-4" />
                    {showLabel && <span className="ml-2">Block User</span>}
                </>
            )}
        </Button>
    );
}
