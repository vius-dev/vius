'use client';

import { useState } from 'react';
import { sections, SectionId } from '@/config/uiConfig';
import { Newspaper, Landmark, Vote, LineChart, PenSquare, Scale, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Article } from '@/types/article';
import UserMenu from './UserMenu';
import SearchBar from './SearchBar';
import NotificationDropdown from './NotificationDropdown';

interface MobileNavProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  articles?: Article[];
  onArticleClick?: (article: Article) => void;
}

const iconMap = {
  Newspaper,
  Landmark,
  Vote,
  LineChart,
  PenSquare,
  Scale,
};

export default function MobileNav({
  activeSection,
  onSectionChange,
  theme,
  onThemeToggle,
  articles = [],
  onArticleClick = () => { },
}: MobileNavProps) {
  const [trendingOpen, setTrendingOpen] = useState(false);

  const handleArticleClick = (article: Article) => {
    setTrendingOpen(false);
    onArticleClick(article);
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <UserMenu align="start" />
          </div>

          <h1 className="text-xl font-bold text-primary absolute left-1/2 -translate-x-1/2">The Capitol</h1>

          <div className="flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Search className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-auto p-4 pt-10">
                <SheetTitle className="sr-only">Search Articles</SheetTitle>
                <SearchBar onArticleClick={onArticleClick} />
              </SheetContent>
            </Sheet>

            <NotificationDropdown />
          </div>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {sections.map((section) => {
            const Icon = iconMap[section.icon as keyof typeof iconMap];
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                aria-label={section.label}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{section.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
