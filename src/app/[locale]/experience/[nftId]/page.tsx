// app/[locale]/experience/[nftId]/page.tsx
'use client';

import { useMemo } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, ShoppingCart, Loader, Store, BadgeCheck, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// Interfaces
interface NftFields {
    name: string;
    description: string;
    image_url: { url: string };
    provider_address: string;
}
interface ListingFields {
    price: string;
    is_available: boolean;
    is_tkt_listing: boolean;
    seller: string;
    provider_id: string;
    nft: { fields: NftFields };
}

export default function ExperienceDetailPage() {
    const params = useParams();
    const listingId = params.nftId as string; 
    
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const { data: listingData, isLoading, isError } = useSuiClientQuery('getObject', {
        id: listingId,
        options: { showContent: true }
    });

    const fields = listingData?.data?.content?.dataType === 'moveObject' ? listingData.data.content.fields as unknown as ListingFields : null;

    // Lógica de Transacción Corregida
    // Reemplaza esta función completa
    const handlePurchase = async () => {
        if (!currentAccount?.address || !fields) return;

        const tx = new Transaction();
        const priceInMist = BigInt(fields.price);

        if (fields.is_tkt_listing) {
            // Lógica para TKT (ya era correcta, pero se incluye para que esté completa)
            const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
            const { data: userTktCoins } = await suiClient.getCoins({ owner: currentAccount.address, coinType: TKT_COIN_TYPE });
            if (!userTktCoins || userTktCoins.length === 0) {
                toast({ variant: "destructive", title: "Insufficient Funds", description: "You don't have any TKT tokens." });
                return;
            }
            
            const totalTktBalance = userTktCoins.reduce((acc, coin) => acc + BigInt(coin.balance), 0n);
            if (totalTktBalance < priceInMist) {
                toast({ variant: "destructive", title: "Insufficient TKT balance" });
                return;
            }

            const mainCoin = tx.moveCall({
                target: '0x2::coin::into_balance',
                arguments: [tx.object(userTktCoins[0].coinObjectId)],
                typeArguments: [TKT_COIN_TYPE],
            });

            if (userTktCoins.length > 1) {
                tx.mergeCoins(mainCoin, userTktCoins.slice(1).map(c => tx.object(c.coinObjectId)));
            }

            const paymentCoin = tx.moveCall({
                target: '0x2::coin::from_balance',
                arguments: [tx.splitCoins(mainCoin, [tx.pure(priceInMist)])],
                typeArguments: [TKT_COIN_TYPE],
            });
            
            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::purchase_with_tkt`,
                arguments: [ 
                    tx.object(listingId), 
                    tx.object(suiConfig.daoTreasuryId),
                    tx.object(suiConfig.tktTreasuryCapId),
                    paymentCoin 
                ],
            });

        } else {
            // --- CORRECCIÓN EN LA LÓGICA PARA SUI ---
            const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);
            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::purchase`,
                // Se pasan los argumentos que la función final espera:
                arguments: [
                    tx.object(listingId),
                    tx.object(suiConfig.vipRegistryId),
                    tx.object(suiConfig.stakingPoolId),
                    paymentCoin,
                ],
            });
        }
        
        try {
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: "✅ Purchase Successful!", description: "You have acquired the experience." });
            queryClient.invalidateQueries({ queryKey: ['get-all-listings-graphql-v5-secondary-market'] });
            queryClient.invalidateQueries({ queryKey: ['my-assets', currentAccount.address] });
        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Purchase Failed", description: error.message });
        }
    };

    const isResale = useMemo(() => fields ? fields.seller !== fields.nft.fields.provider_address : false, [fields]);
    const isOwner = useMemo(() => fields ? fields.seller === currentAccount?.address : false, [fields, currentAccount]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10" /></div>;
    if (isError || !fields) return (
        <div className="min-h-screen flex items-center justify-center text-center p-4">
            <Card className="glass-card p-8"><AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h1 className="text-2xl font-bold text-foreground">Experience Not Found</h1>
                <p className="mt-2 text-muted-foreground">This item may have been sold or is no longer available.</p>
                <Button asChild className="mt-6 btn-sui-outline"><Link href="/">Back to Marketplace</Link></Button>
            </Card>
        </div>
    );
    
    const currencySymbol = fields.is_tkt_listing ? "TKT" : "SUI";
    const price = Number(fields.price) / (10 ** 9);

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace</Link>
                    </Button>
                </div>
                <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                    <div className="lg:col-span-3">
                        <Card className="overflow-hidden shadow-2xl rounded-2xl">
                            <img src={fields.nft.fields.image_url.url} alt={fields.nft.fields.name} className="w-full h-auto object-cover aspect-video" />
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-4xl font-bold pt-4 text-foreground">{fields.nft.fields.name}</CardTitle>
                                <CardDescription className="text-base pt-2">{fields.nft.fields.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Tarjeta de Vendedor */}
                                <div className="p-4 border rounded-lg bg-background/50 space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase">Seller</Label>
                                    <div className='flex items-center gap-2'>
                                        {isResale ? (
                                            <><Store className="w-5 h-5 text-primary" /><p className="font-mono text-sm text-foreground truncate">{fields.seller}</p></>
                                        ) : (
                                            <Link href={`/provider/${fields.provider_id}`} className="font-semibold text-primary hover:underline flex items-center">
                                                <BadgeCheck className="w-5 h-5 mr-2"/> Original Creator
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Tarjeta de Precio y Compra */}
                        <Card className="glass-card">
                           <CardContent className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-muted-foreground">Price</div>
                                    <div className="text-3xl font-bold text-foreground">{price.toLocaleString('en-US')} {currencySymbol}</div>
                                </div>
                                <div className="pt-4">
                                    <Button size="lg" className="w-full text-lg py-7 btn-sui" onClick={handlePurchase} disabled={isPending || !currentAccount || !fields.is_available || isOwner}>
                                        <ShoppingCart className="w-6 h-6 mr-3" />
                                        {isPending ? "Processing..." : (currentAccount ? (isOwner ? "This is Your Listing" : "Buy Now") : "Connect Wallet to Buy")}
                                    </Button>
                                    {!fields.is_available && <p className="text-center text-destructive mt-2 font-semibold">This item is no longer available.</p>}
                                </div>
                            </CardContent>
                        </Card>
                         {/* Tarjeta de Detalles Clave */}
                        <Card className="glass-card">
                            <CardHeader><CardTitle className="text-md font-semibold text-foreground">Key Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-500" /><span className="text-muted-foreground">Verifiable on-chain asset</span></div>
                                <div className="flex items-center gap-3"><Zap className="w-5 h-5 text-blue-500" /><span className="text-muted-foreground">Instant delivery upon purchase</span></div>
                                <div className="flex items-center gap-3"><Store className="w-5 h-5 text-purple-500" /><span className="text-muted-foreground">Supports secondary market royalties</span></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}
