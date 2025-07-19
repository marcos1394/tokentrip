'use client';

import { useState } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction, bcs } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import { useToast } from "@/hooks/use-toast";
import { useWalrus } from "@/hooks/useWalrus";
import { EvolutionRuleBuilder, EvolutionRuleFE } from "@/components/provider/EvolutionRuleBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Attribute } from "@/lib/types"; // Asumiendo que tienes un tipo `Attribute` en `src/lib/types.ts`

// Define la estructura de un perfil de proveedor para el tipado
interface ProviderProfile {
    data: { objectId: string; }
}

export default function MintExperiencePage() {
    const account = useCurrentAccount();
    const { toast } = useToast();
    const { walrusClient } = useWalrus();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
    
    // --- ESTADOS PARA EL FORMULARIO DEL NFT ---
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [eventName, setEventName] = useState('');
    const [eventCity, setEventCity] = useState('');
    const [validityDetails, setValidityDetails] = useState('');
    const [experienceType, setExperienceType] = useState('');
    const [tier, setTier] = useState('Standard');
    const [serialNumber, setSerialNumber] = useState('1');
    const [collectionName, setCollectionName] = useState('');
    const [isRedeemable, setIsRedeemable] = useState(true);
    const [expiration, setExpiration] = useState<Date | undefined>();
    const [evolutionRules, setEvolutionRules] = useState<EvolutionRuleFE[]>([]);

    // --- OBTENER EL PERFIL DEL PROVEEDOR ACTUAL ---
    const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery(
        'getOwnedObjects', 
        { owner: account?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` }, limit: 1 },
        { enabled: !!account }
    );
    const providerProfile = providerData?.data?.[0] as ProviderProfile | undefined;


    const handleMint = async () => {
        if (!account || !providerProfile) {
            toast({ variant: 'destructive', title: "Error", description: "You must be a registered provider to mint an NFT." });
            return;
        }
        if (!name || !description || !imageFile) {
            toast({ variant: 'destructive', title: "Incomplete Form", description: "Please fill all required fields and select an image." });
            return;
        }

        try {
            toast({ title: "1/3: Uploading image to decentralized storage..." });
            const fileBuffer = await imageFile.arrayBuffer();
            const blob = new Uint8Array(fileBuffer);
            
            const { blobId } = await walrusClient.writeBlob({
                blob,
                signer: account as any,
                deletable: false,
                epochs: 53,
            });
            const finalImageUrl = `https://gateway.walrus.space/blobs/${blobId}`;
            
            toast({ title: "2/3: Preparing on-chain transaction..." });
            const tx = new Transaction();

            const evolutionRulesForContract = evolutionRules.map(rule => ({
                trigger_type: Number(rule.trigger_type),
                trigger_value: BigInt(rule.trigger_value),
                new_image_url: rule.new_image_url,
                new_description: rule.new_description,
                attributes_to_add: [],
                is_triggered: false,
            }));

            // El tipo `Attribute` debe ser definido en tu código, ej: { key: string, value: string }
            const attributesForContract: Attribute[] = [{ key: "Example", value: "Value" }];
            
            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::provider_mint_experience`,
                arguments: [
                    tx.object(providerProfile.data.objectId),
                    tx.pure.string(name),
                    tx.pure.string(description),
                    tx.pure.string(finalImageUrl),
                    tx.pure.string(eventName),
                    tx.pure.string(eventCity),
                    tx.pure.string(validityDetails),
                    tx.pure.string(experienceType),
                    tx.pure.string(tier),
                    tx.pure.u64(serialNumber),
                    tx.pure.string(collectionName),
                    tx.pure(bcs.vector(bcs.struct("Attribute", { key: bcs.string(), value: bcs.string() })).serialize(attributesForContract)),
                    tx.pure.bool(isRedeemable),
                    tx.pure.u64((expiration?.getTime() || 0).toString()),
                    tx.pure(bcs.vector(bcs.struct("EvolutionRule", {
                        trigger_type: bcs.u8(),
                        trigger_value: bcs.u64(),
                        new_image_url: bcs.string(),
                        new_description: bcs.string(),
                        attributes_to_add: bcs.vector(bcs.struct("Attribute", { key: bcs.string(), value: bcs.string() })),
                        is_triggered: bcs.bool(),
                    })).serialize(evolutionRulesForContract)),
                ],
            });
            
            toast({ title: "3/3: Please approve the transaction in your wallet." });
            await signAndExecuteTransaction({ transaction: tx });
            
            toast({ title: "✅ Experience Minted Successfully!" });
            // Aquí podrías limpiar el formulario o redirigir al dashboard
            // router.push(`/${params.locale}/dashboard`);

        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Minting Failed", description: error.message });
        }
    };
    
    if (isLoadingProfile) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (!providerProfile) {
        return <div className="min-h-screen flex items-center justify-center text-center"><Card className='p-8 glass-card'><CardTitle className='text-destructive flex items-center gap-2'><AlertTriangle />Access Denied</CardTitle><CardDescription className='mt-2'>You must be a registered provider to access this page.</CardDescription></Card></div>
    }

    return (
        <div className="container mx-auto max-w-4xl py-24">
            <h1 className="text-4xl font-bold heading-gradient mb-2">Create a New Experience</h1>
            <p className="text-muted-foreground mb-8">Mint a new NFT on-chain. Fill in the details and add evolutions to make it dynamic.</p>
            
            <div className="space-y-8">
                <Card className="glass-card">
                    <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2"><Label>Name</Label><Input placeholder="e.g., VIP Ticket to Genesis Concert" value={name} onChange={(e) => setName(e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea placeholder="A detailed description of the experience..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="pt-2" /></div>
                        <div className="space-y-2"><Label>Event Name</Label><Input placeholder="Genesis Tour 2025" value={eventName} onChange={(e) => setEventName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Event City</Label><Input placeholder="Mexico City" value={eventCity} onChange={(e) => setEventCity(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Collection Name</Label><Input placeholder="Genesis Tour Tickets" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Tier</Label><Input placeholder="VIP" value={tier} onChange={(e) => setTier(e.target.value)} /></div>
                    </CardContent>
                </Card>

                 <Card className="glass-card">
                    <CardHeader><CardTitle>Behavior and Validity</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5"><Label>Is this NFT Redeemable?</Label><p className="text-sm text-muted-foreground">Enable if this is a ticket/voucher that is consumed upon use.</p></div>
                            <Switch checked={isRedeemable} onCheckedChange={setIsRedeemable} />
                        </div>
                         <div className="space-y-2">
                            <Label>Expiration Date (Optional)</Label>
                            <p className="text-sm text-muted-foreground">The NFT cannot be traded or redeemed after this date. Leave blank if it never expires.</p>
                            <DatePicker date={expiration} setDate={setExpiration} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/>Dynamic Evolutions (Optional)</CardTitle>
                        <CardDescription>Define rules that will automatically change this NFT's appearance or properties based on time or on-chain events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EvolutionRuleBuilder rules={evolutionRules} setRules={setEvolutionRules} />
                    </CardContent>
                </Card>

                <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleMint} disabled={isPending || !account}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Mint Experience NFT
                </Button>
            </div>
        </div>
    );
}
