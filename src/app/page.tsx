'use client';

import { useState, useEffect } from 'react';
import { Article } from '@/types/article';
import { SectionId } from '@/config/uiConfig';
import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import ArticleList from '@/components/ArticleList';
import ArticleView from '@/components/ArticleView';
import CreateArticle from '@/components/CreateArticle';
import FeaturedArticle from '@/components/FeaturedArticle';
import TrendingArticles from '@/components/TrendingArticles';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import SocialLaws from '@/components/SocialLaws';
import { Separator } from '@/components/ui/separator';
import { ArticleListSkeleton } from '@/components/ArticleSkeleton';

function PageContent() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeSection, setActiveSection] = useState<SectionId>('top-stories');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  // Load articles from Supabase
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        // TODO: Uncomment after running migration 20240112_article_drafts.sql
        // .eq('published', true)
        .order('created_at', { ascending: false });

      if (articlesError) throw articlesError;

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const articlesWithComments = articlesData.map(article => ({
        ...article,
        comments: commentsData.filter(comment => comment.article_id === article.id)
      }));

      setArticles(articlesWithComments);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSectionChange = (section: SectionId) => {
    setActiveSection(section);
    setSelectedArticle(null);
  };

  const handleCreateArticle = async (title: string, body: string, section: string, tags: string[], published: boolean, imageUrl?: string, textAlignment?: string) => {
    if (!user) return;

    try {
      const { calculateReadingTime } = await import('@/lib/reading-time');
      const readingTime = calculateReadingTime(body);

      const { data, error } = await supabase
        .from('articles')
        .insert([{
          title,
          body,
          section,
          image_url: imageUrl,
          text_alignment: textAlignment || 'left',
          user_id: user.id,
          published,
          reading_time: readingTime
        }])
        .select()
        .single();

      if (error) throw error;

      const newArticle = { ...data, comments: [] };
      setArticles([newArticle, ...articles]);

      // Add tags to the article if any
      if (tags.length > 0) {
        const { addTagsToArticle } = await import('@/app/tags/actions');
        await addTagsToArticle(data.id, tags);
      }

      setTimeout(() => {
        setActiveSection('top-stories');
      }, 1500);
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const getFilteredArticles = () => {
    if (activeSection === 'top-stories') {
      return articles;
    }
    return articles.filter(article => article.section === activeSection);
  };

  const filteredArticles = getFilteredArticles();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onArticleClick={setSelectedArticle}
        />
        <main className="container mx-auto px-4 py-8 md:py-12 mt-14 md:mt-0 mb-20 md:mb-8">
          <div className="flex flex-col lg:flex-row gap-8 justify-center">
            <div className="flex-1 space-y-8 max-w-2xl">
              <div>
                <h2 className="text-4xl font-bold mb-2">Top Stories</h2>
                <p className="text-muted-foreground">Latest news and updates from across the political spectrum</p>
              </div>
              <ArticleListSkeleton count={5} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onArticleClick={setSelectedArticle}
      />
      <MobileNav
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        articles={articles}
        onArticleClick={setSelectedArticle}
      />

      <main className="container mx-auto px-4 py-8 md:py-12 mt-14 md:mt-0 mb-20 md:mb-8">
        {activeSection === 'create' ? (
          <CreateArticle onCreateArticle={handleCreateArticle} />
        ) : activeSection === 'social-laws' ? (
          <SocialLaws />
        ) : selectedArticle ? (
          <ArticleView
            article={selectedArticle}
            onBack={() => setSelectedArticle(null)}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 justify-center">
            <div className="flex-1 space-y-8 max-w-2xl">
              <div>
                <h2 className="text-4xl font-bold mb-2">
                  {activeSection === 'top-stories' ? 'Top Stories' :
                    activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                </h2>
                <p className="text-muted-foreground">
                  {activeSection === 'top-stories'
                    ? 'Latest news and updates from across the political spectrum'
                    : `Browse articles in ${activeSection}`}
                </p>
              </div>

              {activeSection === 'top-stories' && filteredArticles.length > 0 && (
                <>
                  <FeaturedArticle
                    article={filteredArticles[0]}
                    onClick={() => setSelectedArticle(filteredArticles[0])}
                  />
                  <Separator className="my-8" />
                  <div>
                    <h3 className="text-2xl font-bold mb-4">More Stories</h3>
                    <ArticleList
                      articles={filteredArticles.slice(1)}
                      onArticleClick={setSelectedArticle}
                    />
                  </div>
                </>
              )}

              {activeSection !== 'top-stories' && (
                <ArticleList
                  articles={filteredArticles}
                  onArticleClick={setSelectedArticle}
                />
              )}

              {/* Mobile Newsletter */}
              <div className="lg:hidden mt-8">
                <Newsletter />
              </div>
            </div>

            {/* Trending Sidebar - Desktop Only */}
            <aside className="hidden lg:block w-80 shrink-0">
              <div className="sticky top-24 space-y-6">
                <TrendingArticles
                  onArticleClick={setSelectedArticle}
                />
                <Newsletter />
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <PageContent />
    </AuthProvider>
  );
}
