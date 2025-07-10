'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, UserX, Loader, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    
    const [providerAddress, setProviderAddress] = useState('');
    // Renombrado a mutateAsync para claridad con async/await
    const { mutateAsync: executeTx, isPending } = useSignAndExecuteTransaction();

    const handleVipAction = async (action: 'add' | 'remove') => {
        if (!currentAccount || currentAccount.address !== process.env.NEXT_PUBLIC_ADMIN_ADDRESS) {
            toast({ variant: 'destructive', title: 'Unauthorized Action' });
            return;
        }
        if (!providerAddress.trim()) {
            toast({ variant: 'destructive', title: 'Address Required' });
            return;
        }

        const tx = new Transaction();
        const functionName = action === 'add' ? 'add_vip' : 'remove_vip';

        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::${functionName}`,
            arguments: [
                tx.object(suiConfig.adminCapId),
                tx.object(suiConfig.vipRegistryId),
                tx.pure.address(providerAddress),
            ],
        });

        try {
            await executeTx({
                transaction: tx,
            });

            toast({
                title: "✅ Success!",
                description: `Provider has been successfully ${action === "add" ? "added to" : "removed from"} the VIP list.`,
            });
            setProviderAddress("");

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "❌ Operation Failed",
                description: error?.message || "An unknown error occurred.",
            });
        }
    };

    // Renderizado del JSX con textos en inglés
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
                
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">VIP Admin Panel</h1>
                        <p className="text-muted-foreground mt-2">Manage the list of providers with reduced platform fees.</p>
                    </div>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-foreground">Manage Provider</CardTitle>
                            <CardDescription>Enter the provider's wallet address to add or remove them from the VIP list.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input 
                                id="providerAddress" 
                                placeholder="0x..."
                                value={providerAddress}
                                onChange={(e) => setProviderAddress(e.target.value)}
                                disabled={isPending}
                            />
                            <div className="flex gap-4">
                                <Button className="w-full btn-sui" onClick={() => handleVipAction('add')} disabled={isPending}>
                                    {isPending ? <Loader className="animate-spin w-5 h-5"/> : <UserPlus className="w-5 h-5" />}
                                    <span className="ml-2">Add to VIP</span>
                                </Button>
                                <Button variant="destructive" className="w-full" onClick={() => handleVipAction('remove')} disabled={isPending}>
                                    {isPending ? <Loader className="animate-spin w-5 h-5"/> : <UserX className="w-5 h-5" />}
                                    <span className="ml-2">Remove from VIP</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="mt-8">
                         <h3 className="text-2xl font-bold text-foreground mb-4">Current VIP List</h3>
                         <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                             <ShieldCheck className="mx-auto w-10 h-10 mb-2"/>
                             Coming Soon: The full list will be displayed here.
                         </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}