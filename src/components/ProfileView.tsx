'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Article } from '@/types/article';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Link as LinkIcon, Twitter, Edit2, Calendar, FileText, MessageSquare, Bookmark, Activity, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import EditProfileModal from '@/components/EditProfileModal';
import ArticleCard from '@/components/ArticleCard';
import { supabase } from '@/lib/supabase';
import FollowButton from './FollowButton';
import UserList from './UserList';
import { getFollowers, getFollowing } from '@/app/profile/actions';
import ActivityFeed from './ActivityFeed';




interface ProfileViewProps {
    profile: {
        id: string;
        display_name?: string;
        email?: string;
        bio?: string;
        location?: string;
        website?: string;
        twitter_handle?: string;
        avatar_url?: string;
        created_at: string;
    };
    articles: Article[];
    comments: any[];
    initialIsFollowing: boolean;
    followCounts: {
        followers: number;
        following: number;
    };
}

export default function ProfileView({ profile, articles, comments, initialIsFollowing, followCounts }: ProfileViewProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);
    const isOwnProfile = user?.id === profile.id;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Fetch bookmarked articles if viewing own profile
    useEffect(() => {
        if (isOwnProfile && user) {
            fetchBookmarks();
        }
    }, [isOwnProfile, user]);

    const fetchBookmarks = async () => {
        if (!user) return;

        setLoadingBookmarks(true);
        try {
            const { data, error } = await supabase
                .from('bookmarks')
                .select('article_id, articles(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Extract articles from the joined data
            // bookmark.articles is a single article object (or null), not an array
            const articles = data?.map((bookmark: any) => bookmark.articles as Article | null)
                .filter((article): article is Article => article !== null) || [];
            setBookmarkedArticles(articles);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        } finally {
            setLoadingBookmarks(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-2"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <Avatar className="h-24 w-24 md:h-32 md:w-32">
                            <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                            <AvatarFallback className="text-2xl">
                                {getInitials(profile.display_name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">{profile.display_name || 'Anonymous User'}</h1>
                                    <p className="text-muted-foreground">{profile.email}</p>
                                </div>
                                {isOwnProfile ? (
                                    <Button onClick={() => setEditModalOpen(true)} variant="outline">
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <FollowButton
                                        targetUserId={profile.id}
                                        initialIsFollowing={initialIsFollowing}
                                    />
                                )}
                            </div>

                            {profile.bio && (
                                <p className="text-foreground leading-relaxed">{profile.bio}</p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {profile.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {profile.location}
                                    </div>
                                )}
                                {profile.website && (
                                    <a
                                        href={profile.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-primary"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        {profile.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                                {profile.twitter_handle && (
                                    <a
                                        href={`https://twitter.com/${profile.twitter_handle}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-primary"
                                    >
                                        <Twitter className="h-4 w-4" />
                                        @{profile.twitter_handle}
                                    </a>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Joined {formatDate(profile.created_at)}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{articles.length}</span>
                                    <span className="text-muted-foreground">Articles</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{comments.length}</span>
                                    <span className="text-muted-foreground">Comments</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{followCounts.followers}</span>
                                    <span className="text-muted-foreground">Followers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{followCounts.following}</span>
                                    <span className="text-muted-foreground">Following</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Content Tabs */}
            <Tabs defaultValue="articles" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
                    <TabsTrigger value="articles">
                        <FileText className="h-4 w-4 mr-2" />
                        Articles
                    </TabsTrigger>
                    <TabsTrigger value="comments">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comments
                    </TabsTrigger>
                    {isOwnProfile && (
                        <TabsTrigger value="bookmarks">
                            <Bookmark className="h-4 w-4 mr-2" />
                            Bookmarks
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="activity">
                        <Activity className="h-4 w-4 mr-2" />
                        Activity
                    </TabsTrigger>
                    <TabsTrigger value="followers">
                        Followers
                    </TabsTrigger>
                    <TabsTrigger value="following">
                        Following
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="articles" className="space-y-4 mt-6">
                    {articles.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No articles yet
                            </CardContent>
                        </Card>
                    ) : (
                        articles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                onClick={() => router.push(`/article/${article.id}`)}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="comments" className="space-y-4 mt-6">
                    {comments.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No comments yet
                            </CardContent>
                        </Card>
                    ) : (
                        comments.map((comment) => (
                            <Card key={comment.id}>
                                <CardContent className="pt-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>Commented on</span>
                                            <Badge variant="secondary">{comment.articles?.title}</Badge>
                                        </div>
                                        <p className="text-foreground">{comment.text}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {isOwnProfile && (
                    <TabsContent value="bookmarks" className="space-y-4 mt-6">
                        {loadingBookmarks ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    Loading bookmarks...
                                </CardContent>
                            </Card>
                        ) : bookmarkedArticles.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No bookmarked articles yet</p>
                                    <p className="text-sm mt-2">Bookmark articles to read them later</p>
                                </CardContent>
                            </Card>
                        ) : (
                            bookmarkedArticles.map((article) => (
                                <ArticleCard
                                    key={article.id}
                                    article={article}
                                    onClick={() => router.push(`/article/${article.id}`)}
                                />
                            ))
                        )}
                    </TabsContent>
                )}

                <TabsContent value="activity" className="mt-6">
                    <ActivityFeed userId={profile.id} />
                </TabsContent>

                <TabsContent value="followers" className="mt-6">
                    <FollowersList userId={profile.id} />
                </TabsContent>

                <TabsContent value="following" className="mt-6">
                    <FollowingList userId={profile.id} />
                </TabsContent>
            </Tabs>

            <EditProfileModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                profile={profile}
            />
        </div>
    );
}

function FollowersList({ userId }: { userId: string }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFollowers(userId).then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, [userId]);

    if (loading) return <div className="text-center py-8">Loading...</div>;
    return <UserList users={users} emptyMessage="No followers yet" />;
}

function FollowingList({ userId }: { userId: string }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFollowing(userId).then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, [userId]);

    if (loading) return <div className="text-center py-8">Loading...</div>;
    return <UserList users={users} emptyMessage="Not following anyone yet" />;
}
