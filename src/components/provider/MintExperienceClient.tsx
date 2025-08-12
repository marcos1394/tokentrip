'use client';

import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import { useToast } from "@/hooks/use-toast";
import { WalrusClient, WalrusFile } from "@mysten/walrus";
import { EvolutionRuleBuilder, EvolutionRuleFE } from "@/components/provider/EvolutionRuleBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Attribute } from "@/lib/types";
import { bcs } from '@mysten/sui/bcs';

interface ProviderProfile {
    data: { objectId: string; }
}
type WalrusClientInstance = WalrusClient;

export default function MintExperienceClient() {
    const account = useCurrentAccount();
    const { toast } = useToast();
    const suiClient = useSuiClient();
    const [walrusClient, setWalrusClient] = useState<WalrusClientInstance | null>(null);

    useEffect(() => {
        if (suiClient && account) {
            const activeChain = account.chains[0];
            if (activeChain === 'sui:testnet' || activeChain === 'sui:mainnet') {
                const client = new WalrusClient({
                    suiClient,
                    network: activeChain.slice(4) as 'testnet' | 'mainnet',
                });
                setWalrusClient(client);
            }
        } else {
            setWalrusClient(null);
        }
    }, [suiClient, account]);

    const { mutateAsync: signAndExecuteTx } = useSignAndExecuteTransaction();

    // --- ESTADOS PARA EL FORMULARIO ---
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
    const [isMinting, setIsMinting] = useState(false);

    const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery('getOwnedObjects', { owner: account?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` }, limit: 1, options: {showContent: true} }, { enabled: !!account });
    const providerProfile = providerData?.data?.[0] as ProviderProfile | undefined;
    
    const handleMint = async () => {
    if (!account || !providerProfile || !walrusClient) {
        toast({ variant: 'destructive', title: "Error", description: "Wallet not connected or client not ready." });
        return;
    }
    if (!name || !description || !imageFile) {
        toast({ variant: 'destructive', title: "Incomplete Form", description: "Please fill in the name, description, and select an image." });
        return;
    }
    setIsMinting(true);
    try {
        toast({ title: "1/4: Uploading image..." });
        const imageArrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(imageArrayBuffer);
        const flow = walrusClient.writeFilesFlow({
            files: [ WalrusFile.from({ contents: uint8Array, identifier: imageFile.name }) ],
        });
        await flow.encode();
        
        toast({ title: "2/4: Approving storage transaction..." });
        const registerTx = flow.register({ epochs: 5, owner: account.address, deletable: false });
        const registerResult = await signAndExecuteTx({ transaction: registerTx, account });
        
        toast({ title: "3/4: Transferring data..." });
        await flow.upload({ digest: registerResult.digest });
        
        toast({ title: "4/4: Approving certification transaction..." });
        const certifyTx = flow.certify();
        await signAndExecuteTx({ transaction: certifyTx, account });

        const files = await flow.listFiles();
        const finalImageUrl = `https://gateway.walrus.space/blobs/${files[0].blobId}`;
        console.log('✅ [MINT] Image uploaded successfully. URL:', finalImageUrl);

        toast({ title: "Preparing mint transaction..." });
        const tx = new Transaction();

        // --- 1. OBTENER EL TIPO DE CONTENIDO DEL ARCHIVO ---
        const contentType = imageFile.type || 'application/octet-stream'; // Ej: "image/png", "video/mp4"

        const attributesForContract: Attribute[] = [{ key: "Example", value: "Value" }];
        const attributeKeys = attributesForContract.map(attr => attr.key);
        const attributeValues = attributesForContract.map(attr => attr.value);
        
        const ruleTriggerTypes = evolutionRules.map(rule => Number(rule.trigger_type));
        const ruleTriggerValues = evolutionRules.map(rule => rule.trigger_value.toString());
        const ruleNewImageUrls = evolutionRules.map(rule => rule.new_image_url);
        const ruleNewDescriptions = evolutionRules.map(rule => rule.new_description);
        
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::provider_mint_experience`,
            arguments: [
                tx.object(providerProfile.data.objectId),
                tx.pure.string(name),
                tx.pure.string(description),
                tx.pure.string(finalImageUrl),
                tx.pure.string(contentType), // <-- 2. AÑADIR EL NUEVO ARGUMENTO
                tx.pure.string(eventName),
                tx.pure.string(eventCity),
                tx.pure.string(validityDetails),
                tx.pure.string(experienceType),
                tx.pure.string(tier),
                tx.pure.u64(Number(serialNumber)),
                tx.pure.string(collectionName),
                tx.pure.vector('string', attributeKeys),
                tx.pure.vector('string', attributeValues),
                tx.pure.bool(isRedeemable),
                tx.pure.u64((expiration?.getTime() || 0).toString()),
                tx.pure.vector('u8', ruleTriggerTypes),
                tx.pure.vector('u64', ruleTriggerValues),
                tx.pure.vector('string', ruleNewImageUrls),
                tx.pure.vector('string', ruleNewDescriptions),
            ],
        });
        
        toast({ title: "Please approve the final transaction in your wallet." });
        const mintResult = await signAndExecuteTx({ transaction: tx, account });
        
        const txResult = await suiClient.waitForTransaction({
            digest: mintResult.digest,
            options: { showEffects: true }
        });

        if (txResult.effects?.status.status === 'success') {
            toast({ title: "✅ Experience Minted Successfully!" });
        } else {
            throw new Error("The minting transaction failed on-chain.");
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "❌ Minting Failed", description: error.message || "An unexpected error occurred." });
        console.error("❌ [MINT] Process failed:", error);
    } finally {
        setIsMinting(false);
    }
};

    if (isLoadingProfile) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (!providerProfile) {
        return <div className="min-h-screen flex items-center justify-center text-center"><Card className='p-8 glass-card'><CardHeader><CardTitle className='text-destructive flex items-center gap-2'><AlertTriangle />Access Denied</CardTitle><CardDescription className='mt-2'>You must be a registered provider to access this page.</CardDescription></CardHeader></Card></div>
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

                <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleMint} disabled={isMinting || !account || !walrusClient}>
                    {isMinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Mint Experience NFT
                </Button>
            </div>
        </div>
    );
}