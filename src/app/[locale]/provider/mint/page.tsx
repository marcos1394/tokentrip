// src/app/[locale]/provider/mint/page.tsx
'use client';

import { useState } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction, bcs } from '@mysten/sui/transactions';
import { suiConfig } from "@/config/sui';
import { useToast } from "@/hooks/use-toast";
import { EvolutionRuleBuilder, EvolutionRuleFE } from "@/components/provider/EvolutionRuleBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Asumimos que esta query te devuelve el ProviderProfile del usuario conectado
// const { data: providerProfile } = useSuiClientQuery(...)

export default function MintExperiencePage() {
    const account = useCurrentAccount();
    const { toast } = useToast();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
    
    // Estados para el formulario del NFT
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    // ... otros estados para los campos del NFT
    const [isRedeemable, setIsRedeemable] = useState(true);
    const [expiration, setExpiration] = useState<Date | undefined>();

    // Estado para las reglas de evolución
    const [rules, setRules] = useState<EvolutionRuleFE[]>([]);

    const handleMint = async () => {
        // En un caso real, obtendrías el ID del perfil del proveedor
        const providerProfileId = "0x..."; // Placeholder

        const tx = new Transaction();

        // Serializar las reglas de evolución al formato que espera el contrato
        const evolutionRulesForContract = rules.map(rule => ({
            trigger_type: Number(rule.trigger_type),
            trigger_value: BigInt(rule.trigger_value),
            new_image_url: rule.new_image_url,
            new_description: rule.new_description,
            attributes_to_add: [], // Por ahora vacío para simplificar
            is_triggered: false,
        }));

        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::provider_mint_experience`,
            arguments: [
                tx.object(providerProfileId),
                tx.pure.string(name),
                tx.pure.string(description),
                // ... pasar TODOS los demás argumentos del NFT
                tx.pure.bool(isRedeemable),
                tx.pure.u64(expiration?.getTime() || 0),
                tx.pure(bcs.vector('EvolutionRule').serialize(evolutionRulesForContract)),
            ],
        });
        
        try {
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: "✅ Experience Minted!" });
        } catch(error: any) {
            toast({ variant: "destructive", title: "❌ Minting Failed", description: error.message });
        }
    };

    return (
        <div className="container mx-auto max-w-3xl py-12">
            <h1 className="text-4xl font-bold heading-gradient mb-8">Create a New Experience</h1>
            <div className="space-y-8">
                <Card>
                    <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                        {/* ... Aquí irían todos los demás campos del NFT ... */}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Dynamic Evolutions (Optional)</CardTitle></CardHeader>
                    <CardContent>
                        <EvolutionRuleBuilder rules={rules} setRules={setRules} />
                    </CardContent>
                </Card>

                <Button size="lg" className="w-full btn-sui" onClick={handleMint} disabled={isPending || !account}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Mint Experience NFT
                </Button>
            </div>
        </div>
    );
}
