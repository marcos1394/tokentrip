'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bcs } from '@mysten/sui/bcs';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, PlusCircle, X, Sprout, Loader, User, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Interfaces
interface NftFields {
    name: string;
    image_url: { url: string };
}
interface Share {
    id: number;
    percentage: string;
    recipient: string;
}

const isValidSuiAddress = (address: string) => /^0x[a-fA-F0-9]{64}$/.test(address);

export default function FractionalizePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();
    
    const nftId = params.nftId as string;

    // --- Lógica de UI Implementada y Mejorada ---
    const [shares, setShares] = useState<Share[]>([{ id: Date.now(), percentage: '', recipient: '' }]);
    const { mutateAsync: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
    
    const { data: nftData, isLoading, isError } = useSuiClientQuery('getObject', { id: nftId, options: { showContent: true } }, { enabled: !!nftId });

    const handleShareChange = (index: number, field: keyof Omit<Share, 'id'>, value: string) => {
        const newShares = [...shares];
        newShares[index][field] = value;
        setShares(newShares);
    };

    const handleAddShare = () => {
        setShares([...shares, { id: Date.now(), percentage: '', recipient: '' }]);
    };

    const handleRemoveShare = (id: number) => {
        setShares(shares.filter(share => share.id !== id));
    };

    const { totalPercentage, ownerRemainder, isFormInvalid } = useMemo(() => {
        const validShares = shares.filter(s => s.percentage.trim() !== '' && !isNaN(parseFloat(s.percentage)));
        const total = validShares.reduce((sum, s) => sum + parseFloat(s.percentage), 0);
        const hasInvalidAddress = shares.some(s => s.recipient.trim() !== '' && !isValidSuiAddress(s.recipient));
        const invalid = total > 100 || hasInvalidAddress || total < 0;
        return { totalPercentage: total, ownerRemainder: 100 - total, isFormInvalid: invalid };
    }, [shares]);
    
    // --- Lógica de Transacción Corregida ---
    const handleFractionalize = async () => {
        if (isFormInvalid) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please check your inputs. Total percentage cannot exceed 100% and all addresses must be valid.' });
            return;
        }

        const sharesToTransfer = shares.filter(s => s.percentage.trim() !== '' && parseFloat(s.percentage) > 0 && s.recipient.trim() !== '' && isValidSuiAddress(s.recipient));

        if (sharesToTransfer.length === 0 && ownerRemainder <= 0) {
            toast({ variant: 'destructive', title: 'Nothing to Fractionalize', description: 'You must assign at least one share to a recipient.' });
            return;
        }
        
        const tx = new Transaction();
        
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::fractionize`,
            arguments: [
                tx.object(nftId),
                tx.pure(bcs.vector(bcs.U64).serialize(sharesToTransfer.map(s => BigInt(s.percentage)))),
                tx.pure(bcs.vector(bcs.Address).serialize(sharesToTransfer.map(s => s.recipient)))
            ]
        });

        try {
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: '✅ Fractionalization Successful!', description: 'The shares have been distributed.' });
            router.push(`/`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Fractionalization Failed', description: error.message });
        }
    };

    const nftFields = nftData?.data?.content?.dataType === 'moveObject' ? nftData.data.content.fields as unknown as NftFields : null;

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10" /></div>;
    if (isError || !nftFields) return <div className="min-h-screen flex items-center justify-center">Error: Could not load NFT data.</div>;

    // --- JSX con Textos en Inglés y Mejoras de UI ---
    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
                    </Button>
                </div>
                
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Fractionalize Experience</h1>
                        <p className="text-muted-foreground mt-2">Assign ownership percentages to other wallets. Any unassigned portion will remain yours.</p>
                    </div>

                    <Card className="mb-8 glass-card flex items-center gap-6 p-4">
                        <img src={nftFields.image_url.url} alt={nftFields.name} className="w-24 h-24 object-cover rounded-lg" />
                        <div className="flex-grow">
                            <CardTitle className="text-foreground">{nftFields.name}</CardTitle>
                            <CardDescription>ID: {nftId.slice(0, 6)}...{nftId.slice(-4)}</CardDescription>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        {shares.map((share, index) => {
                            const isAddressValid = isValidSuiAddress(share.recipient);
                            return (
                                <Card key={share.id} className="glass-card p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div>
                                            <Label htmlFor={`percentage-${index}`} className="text-muted-foreground">Percentage (%) to transfer</Label>
                                            <Input id={`percentage-${index}`} type="number" value={share.percentage} onChange={(e) => handleShareChange(index, 'percentage', e.target.value)} placeholder="e.g., 25" className="mt-1"/>
                                        </div>
                                        <div>
                                            <Label htmlFor={`recipient-${index}`} className="text-muted-foreground">Recipient Address</Label>
                                            <div className="flex items-center gap-2">
                                                <Input id={`recipient-${index}`} value={share.recipient} onChange={(e) => handleShareChange(index, 'recipient', e.target.value)} placeholder="0x..." className={`mt-1 font-mono ${share.recipient && !isAddressValid ? 'border-destructive' : ''}`}/>
                                                {shares.length > 1 && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveShare(share.id)}>
                                                        <X className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                    
                    <Button variant="outline" onClick={handleAddShare} className="mt-4 w-full glass-card">
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Recipient
                    </Button>
                    
                    <div className="mt-8 p-6 glass-card rounded-lg space-y-6">
                        <div className="flex justify-between items-center text-lg">
                            <span className="flex items-center text-muted-foreground"><Percent className="w-5 h-5 mr-2"/> Total Assigned:</span>
                            <span className={`font-bold ${totalPercentage > 100 ? 'text-destructive' : 'text-foreground'}`}>{totalPercentage.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-lg border-t pt-4">
                            <span className="flex items-center font-bold text-foreground"><User className="w-5 h-5 mr-2"/> Your Remaining Share:</span>
                            <span className="font-bold text-green-500">{ownerRemainder >= 0 ? ownerRemainder.toFixed(2) : '0.00'}%</span>
                        </div>
                        
                        <Button size="lg" className="w-full mt-6 text-lg py-6 btn-sui" onClick={handleFractionalize} disabled={isPending || isFormInvalid}>
                            {isPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Sprout className="w-5 h-5 mr-2" />}
                            {isPending ? "Fractionalizing..." : "Confirm & Fractionalize"}
                        </Button>
                    </div>
                </div>
                <Toaster />
            </div>
        </div>
    );
}