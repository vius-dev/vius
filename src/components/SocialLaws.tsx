'use client';

import { useState, useEffect } from 'react';
import { SocialLaw } from '@/types/article';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Scale, Plus, Edit2, Trash2, User, Loader2, Quote, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthModal from './AuthModal';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'stupidity', label: 'Stupidity' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'management', label: 'Management' },
  { value: 'economics', label: 'Economics' },
  { value: 'psychology', label: 'Psychology' },
];

export default function SocialLaws() {
  const { user } = useAuth();
  const [laws, setLaws] = useState<SocialLaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editingLaw, setEditingLaw] = useState<SocialLaw | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author_name: '',
    category: 'general',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLaws();
  }, []);

  const loadLaws = async () => {
    try {
      const { data, error } = await supabase
        .from('social_laws')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLaws(data || []);
    } catch (err) {
      console.error('Error loading laws:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      if (editingLaw) {
        const { error } = await supabase
          .from('social_laws')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLaw.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('social_laws')
          .insert([{ ...formData, user_id: user.id }]);

        if (error) throw error;
      }

      await loadLaws();
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save law');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (law: SocialLaw) => {
    if (!user || law.user_id !== user.id) return;
    if (!confirm('Are you sure you want to delete this law?')) return;

    try {
      const { error } = await supabase
        .from('social_laws')
        .delete()
        .eq('id', law.id)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadLaws();
    } catch (err) {
      console.error('Error deleting law:', err);
    }
  };

  const handleEdit = (law: SocialLaw) => {
    setEditingLaw(law);
    setFormData({
      title: law.title,
      description: law.description,
      author_name: law.author_name,
      category: law.category,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', author_name: '', category: 'general' });
    setEditingLaw(null);
    setError('');
  };

  const filteredLaws = selectedCategory === 'all'
    ? laws
    : laws.filter(law => law.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      stupidity: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      productivity: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      management: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      economics: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      psychology: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[category] || colors.general;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold flex items-center gap-3">
            <Scale className="h-10 w-10 text-primary" />
            Social & Metaphoric Laws
          </h2>
          <p className="text-muted-foreground mt-2">
            Timeless observations about human behavior and society
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { if (!user) { setAuthModalOpen(true); } else { setDialogOpen(true); } }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Law
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLaw ? 'Edit Law' : 'Add New Law'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="title">Law Name</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Murphy's Law"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="The law's statement or principle..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Author/Origin</Label>
                    <Input
                      id="author"
                      placeholder="Who coined this?"
                      value={formData.author_name}
                      onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingLaw ? 'Update Law' : 'Add Law'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredLaws.map((law) => (
          <Card key={law.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Quote className="h-5 w-5 text-primary shrink-0" />
                    {law.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(law.category)}>
                      {law.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {law.author_name}
                    </span>
                  </div>
                </div>
                {user && law.user_id === user.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(law)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(law)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground italic leading-relaxed">
                "{law.description}"
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLaws.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No laws found in this category.</p>
          </CardContent>
        </Card>
      )}

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
