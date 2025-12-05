'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Shield, Loader2 } from 'lucide-react';
import { getNotificationSettings, updateNotificationSettings } from '@/app/actions/settings';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';

export default function SettingsPage() {
    const { user } = useAuth();
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) {
            redirect('/');
            return;
        }

        loadSettings();
    }, [user]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const settings = await getNotificationSettings();
            if (settings) {
                setEmailNotifications(settings.email_notifications ?? true);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateNotificationSettings({
                email_notifications: emailNotifications,
            });
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Settings className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-bold">Settings</h1>
                </div>

                <div className="space-y-6">
                    {/* Notifications Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notifications
                            </CardTitle>
                            <CardDescription>
                                Manage how you receive notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="email-notifications">Email Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive email notifications for new comments on your articles
                                            </p>
                                        </div>
                                        <Switch
                                            id="email-notifications"
                                            checked={emailNotifications}
                                            onCheckedChange={setEmailNotifications}
                                        />
                                    </div>

                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        Save Settings
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Security Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security
                            </CardTitle>
                            <CardDescription>
                                Manage your account security settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="rounded-lg border p-4">
                                    <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Add an extra layer of security to your account. To enable 2FA, please ensure it's activated in your Supabase project dashboard.
                                    </p>
                                    <Button variant="outline" disabled>
                                        Configure 2FA
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Note: 2FA must be enabled in Supabase project settings first
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
