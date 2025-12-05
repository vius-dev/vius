'use client';

import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Tag } from 'lucide-react';

interface TagBadgeProps {
    name: string;
    clickable?: boolean;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export default function TagBadge({ name, clickable = true, variant = 'secondary' }: TagBadgeProps) {
    const router = useRouter();

    const handleClick = () => {
        if (clickable) {
            router.push(`/tags/${encodeURIComponent(name)}`);
        }
    };

    return (
        <Badge
            variant={variant}
            className={`gap-1 ${clickable ? 'cursor-pointer hover:bg-primary/20' : ''}`}
            onClick={handleClick}
        >
            <Tag className="h-3 w-3" />
            {name}
        </Badge>
    );
}
