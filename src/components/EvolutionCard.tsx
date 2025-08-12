// src/components/EvolutionCard.tsx
'use client';

import { useMemo } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Loader2, CheckCircle } from 'lucide-react';

// Tipos que este componente espera
interface EvolutionRule {
    trigger_type: number;
    trigger_value: string;
    new_image_url: string; // <-- Ahora es un string simple
    new_description: string;
    is_triggered: boolean;
}
interface ProviderProfile {
    objectId: string; // <-- Se añade el objectId
    content: { fields: { total_reviews: string } };
}

interface EvolutionCardProps {
    rule: EvolutionRule;
    nftId: string;
    providerProfile: ProviderProfile | null;
    currentImageUrl: string;
    onEvolveSuccess: () => void;
}

export function EvolutionCard({ rule, nftId, providerProfile, currentImageUrl, onEvolveSuccess }: EvolutionCardProps) {
    const { toast } = useToast();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
    const account = useCurrentAccount();

    // Lógica para determinar si la condición de evolución se ha cumplido
    const isConditionMet = useMemo(() => {
        if (rule.is_triggered) return false;
        
        if (rule.trigger_type === 0) { // Time-Based
            return Date.now() >= Number(rule.trigger_value);
        }
        if (rule.trigger_type === 1 && providerProfile) { // Goal-Based (Total Reviews)
            return Number(providerProfile.content.fields.total_reviews) >= Number(rule.trigger_value);
        }
        return false;
    }, [rule, providerProfile]);

    const handleEvolve = async () => {
        if (!providerProfile) return;
        
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::evolve_experience`,
            arguments: [
                tx.object(nftId),
                tx.object(providerProfile.objectId), // Asumiendo que el ID del perfil está disponible
                tx.object("0x6") // Clock
            ],
        });

        try {
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: '✅ NFT Evolved!', description: 'The metadata has been updated on-chain.' });
            onEvolveSuccess();
        } catch(error: any) {
            toast({ variant: 'destructive', title: '❌ Evolution Failed', description: error.message });
        }
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    {rule.is_triggered ? <CheckCircle className="text-green-500"/> : <Sparkles className="text-primary" />}
                    Evolution Rule
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm font-semibold">Condition:</p>
                    <p className="text-muted-foreground">
                        {rule.trigger_type === 0 
                            ? `Evolves after ${new Date(Number(rule.trigger_value)).toLocaleDateString()}`
                            : `Evolves when provider reaches ${rule.trigger_value} reviews`
                        }
                    </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <img src={currentImageUrl} className="w-24 h-24 rounded-md border" alt="Current State" />
                    <ArrowRight className="w-8 h-8 text-muted-foreground" />
                    <img src={rule.new_image_url} className="w-24 h-24 rounded-md border" alt="Evolved State" />
                </div>
                {isConditionMet && !rule.is_triggered && (
                    <Button className="w-full btn-sui" onClick={handleEvolve} disabled={isPending || !account}>
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Evolve Now
                    </Button>
                )}
                 {rule.is_triggered && <p className="text-center text-sm font-semibold text-green-500">Evolution Complete!</p>}
            </CardContent>
        </Card>
    );
}
