'use client';

import { Badge } from '@/components/ui/badge';
import { FileEdit } from 'lucide-react';

export default function DraftBadge() {
    return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 dark:text-amber-400">
            <FileEdit className="h-3 w-3" />
            Draft
        </Badge>
    );
}
