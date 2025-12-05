'use client';

import { sections, SectionId } from '@/config/uiConfig';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from './UserMenu';
import SearchBar from './SearchBar';
import NotificationDropdown from './NotificationDropdown';
import { Article } from '@/types/article';

interface HeaderProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onArticleClick: (article: Article) => void;
}

export default function Header({ activeSection, onSectionChange, theme, onThemeToggle, onArticleClick }: HeaderProps) {
  return (
    <header className="hidden md:block border-b border-border bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-primary">The Capitol</h1>
            <nav className="flex space-x-1">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? 'default' : 'ghost'}
                  onClick={() => onSectionChange(section.id)}
                  className="font-medium"
                >
                  {section.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-64">
              <SearchBar onArticleClick={onArticleClick} />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onThemeToggle}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <NotificationDropdown />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
