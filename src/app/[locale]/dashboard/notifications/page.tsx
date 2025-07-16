'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Define la estructura de los ajustes
interface Settings {
    email: string;
    wants_purchase_emails: boolean;
    wants_sale_emails: boolean;
    wants_review_emails: boolean;
    wants_outbid_emails: boolean;
}

export default function NotificationSettingsPage() {
    const account = useCurrentAccount();
    const { toast } = useToast();
    const [settings, setSettings] = useState<Partial<Settings>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Función para cargar los ajustes del usuario
    const fetchSettings = useCallback(async () => {
        if (!account?.address) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/notification-settings?suiAddress=${account.address}`);
            const data = await response.json();
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error loading settings' });
        } finally {
            setIsLoading(false);
        }
    }, [account?.address, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Función para guardar los cambios
    const handleSaveChanges = async () => {
        if (!account?.address) return;
        setIsSaving(true);
        try {
            const response = await fetch('/api/notification-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sui_address: account.address,
                    ...settings
                })
            });
            if (!response.ok) throw new Error("Failed to save settings.");
            toast({ title: '✅ Settings Saved!', description: 'Your notification preferences have been updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving settings' });
        } finally {
            setIsSaving(false);
        }
    }

    const handleSettingChange = (key: keyof Settings, value: string | boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    return (
        <div className="container mx-auto max-w-3xl py-12">
            <div className="space-y-4 mb-8">
                <h1 className="text-4xl font-bold heading-gradient">Notification Settings</h1>
                <p className="text-muted-foreground">Manage how you receive communications from TokenTrip.</p>
            </div>
            
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Enter your email and choose which transactional alerts you'd like to receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={settings.email || ''}
                            onChange={(e) => handleSettingChange('email', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <Label htmlFor="purchase-emails" className="flex flex-col space-y-1">
                            <span>Purchase Confirmations</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Receive an email when you successfully buy an experience.
                            </span>
                        </Label>
                        <Switch
                            id="purchase-emails"
                            checked={settings.wants_purchase_emails ?? true}
                            onCheckedChange={(value) => handleSettingChange('wants_purchase_emails', value)}
                        />
                    </div>

                     <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <Label htmlFor="sale-emails" className="flex flex-col space-y-1">
                            <span>Sale Confirmations</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Get notified when someone buys one of your experiences.
                            </span>
                        </Label>
                        <Switch
                            id="sale-emails"
                            checked={settings.wants_sale_emails ?? true}
                            onCheckedChange={(value) => handleSettingChange('wants_sale_emails', value)}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <Label htmlFor="review-emails" className="flex flex-col space-y-1">
                            <span>New Reviews</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Get notified when a traveler leaves a review on your profile.
                            </span>
                        </Label>
                        <Switch
                            id="review-emails"
                            checked={settings.wants_review_emails ?? true}
                            onCheckedChange={(value) => handleSettingChange('wants_review_emails', value)}
                        />
                    </div>

                     <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <Label htmlFor="outbid-emails" className="flex flex-col space-y-1">
                            <span>Outbid Alerts</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Get notified immediately when someone places a higher bid on an auction.
                            </span>
                        </Label>
                        <Switch
                            id="outbid-emails"
                            checked={settings.wants_outbid_emails ?? true}
                            onCheckedChange={(value) => handleSettingChange('wants_outbid_emails', value)}
                        />
                    </div>

                    <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full btn-sui">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
