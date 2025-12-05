'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, Plus, Loader2 } from 'lucide-react';
import { getCollections } from '@/app/actions/collections';
import Link from 'next/link';

interface Collection {
    id: string;
    title: string;
    description?: string;
    created_at: string;
    collection_items?: { count: number }[];
}

export default function CollectionsList() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setLoading(true);
        try {
            const data = await getCollections();
            setCollections(data);
        } catch (error) {
            console.error('Error loading collections:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Collections</h2>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Collection
                </Button>
            </div>

            {collections.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No collections yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Create collections to organize your articles
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collections.map((collection) => (
                        <Link key={collection.id} href={`/collections/${collection.id}`}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Folder className="h-5 w-5" />
                                        {collection.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {collection.description && (
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {collection.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {collection.collection_items?.[0]?.count || 0} articles
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
