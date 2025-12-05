export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

export interface Comment {
  id: string;
  article_id: string;
  text: string;
  author: string;
  user_id?: string;
  parent_id?: string | null;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  replies?: Comment[];
  user_reaction?: 'like' | 'dislike' | null;
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface Article {
  id: string;
  title: string;
  body: string;
  section: string;
  image_url?: string;
  text_alignment: TextAlignment;
  user_id?: string;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
  likes_count: number;
  dislikes_count: number;
  user_reaction?: 'like' | 'dislike' | null;
  tags?: string[];
  published: boolean;
  scheduled_publish_at?: string;
  views_count: number;
  reading_time: number;
}

export interface SocialLaw {
  id: string;
  title: string;
  description: string;
  author_name: string;
  category: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
