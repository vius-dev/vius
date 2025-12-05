'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Twitter, Facebook, Linkedin, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
    title: string;
    text?: string;
    url?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export default function ShareButton({
    title,
    text,
    url,
    variant = 'outline',
    size = 'icon',
    className
}: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const getUrl = () => {
        if (typeof window !== 'undefined') {
            return url || window.location.href;
        }
        return '';
    };

    const handleNativeShare = async () => {
        const shareUrl = getUrl();
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title,
                    text: text || title,
                    url: shareUrl,
                });
                toast.success('Shared successfully!');
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    // Fallback to dropdown if native share fails unexpectedly
                }
            }
        }
    };

    const handleCopyLink = () => {
        const shareUrl = getUrl();
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied!', {
            description: 'Link has been copied to clipboard.',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSocialShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
        const shareUrl = encodeURIComponent(getUrl());
        const shareText = encodeURIComponent(title);

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
        };

        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    };

    // If Web Share API is available, we could prioritize it, 
    // but often users on desktop still prefer specific buttons.
    // A common pattern is to show the dropdown on desktop and use native share on mobile if we can detect it,
    // or just provide the dropdown which is universally safe.
    // For this implementation, we'll provide the Dropdown as the primary UI, 
    // but if we wanted to force native share on mobile we could check userAgent.
    // However, the "Share" button in the dropdown can trigger native share if desired, 
    // or we can just stick to the custom menu for consistency.

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className} title="Share">
                    <Share2 className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSocialShare('twitter')}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSocialShare('facebook')}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSocialShare('linkedin')}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                </DropdownMenuItem>
                {/* Optional: Add a "More..." option for native share if supported */}
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <DropdownMenuItem onClick={handleNativeShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        More options...
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
