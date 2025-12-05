'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Article } from '@/types/article';

interface SearchBarProps {
    onArticleClick: (article: Article) => void;
}

export default function SearchBar({ onArticleClick }: SearchBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Article[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Handle keyboard shortcuts (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('search_articles', {
                    search_query: query
                });

                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = (searchQuery: string) => {
        setQuery(searchQuery);

        // Save to recent searches
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const handleArticleSelect = (article: Article) => {
        onArticleClick(article);
        setIsOpen(false);
        setQuery('');
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ?
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark> : part
        );
    };

    return (
        <div className="relative" ref={searchRef}>
            {/* Search Button/Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search articles... (⌘K)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="pl-10 pr-10"
                    suppressHydrationWarning
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setQuery('')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (
                <Card className="absolute top-full mt-2 w-full md:w-[500px] max-h-[500px] overflow-y-auto z-50 shadow-lg">
                    <div className="p-4 space-y-4">
                        {/* Recent Searches */}
                        {!query && recentSearches.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Recent Searches
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearRecentSearches}
                                        className="h-auto p-1 text-xs"
                                    >
                                        Clear
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    {recentSearches.map((search, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSearch(search)}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm"
                                        >
                                            {search}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search Results */}
                        {query && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Results {results.length > 0 && `(${results.length})`}
                                </h3>
                                {loading ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">Searching...</p>
                                ) : results.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        No articles found for "{query}"
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {results.map((article) => (
                                            <button
                                                key={article.id}
                                                onClick={() => handleArticleSelect(article)}
                                                className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                                            >
                                                <div className="flex items-start gap-2 mb-1">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {article.section}
                                                    </Badge>
                                                </div>
                                                <h4 className="font-medium text-sm mb-1">
                                                    {highlightText(article.title, query)}
                                                </h4>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {highlightText(article.body.substring(0, 150), query)}...
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
