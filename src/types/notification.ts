export type NotificationType = 'comment_reply' | 'mention' | 'reaction' | 'follow';

export interface Notification {
    id: string;
    user_id: string;
    actor_id: string;
    type: NotificationType;
    resource_id: string;
    resource_type: 'article' | 'comment';
    read: boolean;
    created_at: string;
    actor?: {
        display_name: string;
        avatar_url: string;
    };
    resource?: {
        title?: string;
        text?: string;
    };
}
