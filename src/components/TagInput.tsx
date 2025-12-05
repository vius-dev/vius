'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchTags, Tag } from '@/app/tags/actions';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
}

export default function TagInput({
    value,
    onChange,
    placeholder = 'Add tags...',
    maxTags = 5
}: TagInputProps) {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (input.trim().length > 0) {
                const results = await searchTags(input);
                setSuggestions(results.filter(tag => !value.includes(tag.name)));
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [input, value]);

    const addTag = (tagName: string) => {
        const normalizedTag = tagName.toLowerCase().trim();
        if (normalizedTag && !value.includes(normalizedTag) && value.length < maxTags) {
            onChange([...value, normalizedTag]);
            setInput('');
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim()) {
                addTag(input);
            }
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
                {value.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>

            <div className="relative">
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={value.length >= maxTags ? `Max ${maxTags} tags` : placeholder}
                        disabled={value.length >= maxTags}
                        className="flex-1"
                    />
                    {input && (
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => addTag(input)}
                            disabled={value.length >= maxTags}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                        {suggestions.map((tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => addTag(tag.name)}
                                className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                {value.length}/{maxTags} tags • Press Enter to add
            </p>
        </div>
    );
}
