// app/[locale]/register-provider/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Store, Loader, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProviderInfoCard } from '@/components/provider/ProviderInfoCard';

const isValidUrl = (urlString: string) => {
    try { 
        return Boolean(new URL(urlString)); 
    } catch(e) { 
        return false; 
    }
}

export default function RegisterProviderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();

    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const { mutateAsync: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    // Hook para verificar si el usuario ya tiene un perfil
    const { data: existingProfile, isLoading } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: currentAccount?.address!,
            filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` },
            limit: 1,
        },
        { enabled: !!currentAccount }
    );
    
    const isAlreadyProvider = useMemo(() => existingProfile && existingProfile.data.length > 0, [existingProfile]);
    
    const isFormInvalid = useMemo(() => {
        return !name.trim() || !bio.trim() || !isValidUrl(imageUrl);
    }, [name, bio, imageUrl]);

    const handleRegister = async () => {
        if (!currentAccount) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }
        if (isFormInvalid) {
            toast({ variant: 'destructive', title: 'Incomplete or Invalid Form', description: 'Please fill all fields and provide a valid image URL.' });
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::register_provider`,
            arguments: [
                tx.pure.string(name),
                tx.pure.string(bio),
                tx.pure.string(imageUrl),
            ],
        });

        try {
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: '✅ Registration Successful!', description: `Welcome, ${name}! You are now a provider on TokenTrip.` });
            setTimeout(() => router.push(`/dashboard`), 2000);
        } catch (error: any) {
            toast({ variant: "destructive", title: '❌ Registration Failed', description: error.message });
        }
    };
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10" /></div>;
    }
    
    if (isAlreadyProvider) {
        return (
             <div className="min-h-screen flex items-center justify-center text-center p-4">
                <Card className="max-w-md mx-auto glass-card p-8">
                    <CardHeader>
                        <BadgeCheck className="w-12 h-12 mx-auto text-green-500" />
                        <CardTitle className="text-2xl mt-4 text-foreground">You're Already a Provider!</CardTitle>
                        <CardDescription className="mt-2 text-muted-foreground">You can now manage your experiences and view your sales from your dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-4'>
                        <Button asChild size="lg" className="w-full btn-sui">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                         <Button asChild variant="secondary">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Link>
                    </Button>
                </div>
                
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Become a Provider</h1>
                        <p className="text-muted-foreground mt-2">Create your profile to start selling unique experiences on TokenTrip.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Columna del Formulario */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-2xl text-foreground">Your Profile Details</CardTitle>
                                <CardDescription>This information will be public and visible to all buyers.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-muted-foreground">Store or Brand Name</Label>
                                    <Input id="name" placeholder="e.g., Mayan Adventures" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="text-muted-foreground">Short Bio</Label>
                                    <Textarea id="bio" placeholder="Describe what you offer in one or two sentences..." value={bio} onChange={(e) => setBio(e.target.value)} disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl" className="text-muted-foreground">Logo or Profile Image URL</Label>
                                    <Input id="imageUrl" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={isPending} className={`${imageUrl && !isValidUrl(imageUrl) ? 'border-destructive' : ''}`} />
                                </div>
                                <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleRegister} disabled={isPending || !currentAccount || isFormInvalid}>
                                    {isPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Store className="w-5 h-5 mr-2" />}
                                    {isPending ? "Registering..." : "Create Provider Profile"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Columna de Previsualización */}
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">Live Preview</h3>
                            <ProviderInfoCard 
                                name={name || "Your Brand Name"}
                                bio={bio || "A short description about what makes your experiences unique."}
                                imageUrl={isValidUrl(imageUrl) ? imageUrl : "https://placehold.co/400x400/1e293b/a3a3a3?text=Logo"}
                                averageRating={0}
                                totalReviews={0}
                                isLoading={false}
                                isVerified={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}