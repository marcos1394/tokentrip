'use client';

import { useMemo } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';

// Componentes y UI
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Loader, Store, BadgeCheck, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EvolutionCard } from '@/components/EvolutionCard';

// --- INTERFACES HOMOLOGADAS ---
// Estas interfaces definen la estructura de datos "limpia" que el componente recibe como props.

interface NormalizedNft {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  provider_address: string;
  provider_id: string;
  evolution_rules: any[];
}

// ListingFields sigue siendo necesario para tipar el objeto 'listing' que puede ser nulo
interface ListingFields {
  price: string;
  is_available: boolean;
  is_tkt_listing: boolean;
  seller: string;
  provider_id: string;
}

interface ExperienceDetailClientProps {
  nft: NormalizedNft;
  listing: ListingFields | null;
  providerProfile: any;
  objectId: string; 
}

export function ExperienceDetailClient({ nft, listing, providerProfile, objectId }: ExperienceDetailClientProps) {
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const handlePurchase = async () => {
        if (!currentAccount?.address || !listing) return;
        
        const tx = new Transaction();
        const priceInMist = BigInt(listing.price);

        if (listing.is_tkt_listing) {
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

            const [mainCoin, ...otherCoins] = userTktCoins;
            const mainCoinObject = tx.object(mainCoin.coinObjectId);
            if (otherCoins.length > 0) {
                tx.mergeCoins(mainCoinObject, otherCoins.map(c => tx.object(c.coinObjectId)));
            }
            const [paymentCoin] = tx.splitCoins(mainCoinObject, [tx.pure.u64(priceInMist.toString())]);

            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::purchase_with_tkt`,
                arguments: [ tx.object(objectId), tx.object(suiConfig.daoTreasuryId), tx.object(suiConfig.tktTreasuryCapId), paymentCoin ],
            });
        } else {
            const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist.toString())]);
            
            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::purchase`,
                arguments: [ tx.object(objectId), tx.object(suiConfig.vipRegistryId), tx.object(suiConfig.stakingPoolId), paymentCoin ],
            });
        }
        
        try {
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: "✅ Purchase Successful!" });
            queryClient.invalidateQueries({ queryKey: ['getObject', objectId] });
        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Purchase Failed", description: error.message });
        }
    };

    const isResale = useMemo(() => listing ? listing.seller !== nft.provider_address : false, [listing, nft]);
    const isOwner = useMemo(() => listing ? listing.seller === currentAccount?.address : nft.provider_address === currentAccount?.address, [listing, nft, currentAccount]);
    
    const price = listing ? Number(listing.price) / (10 ** 9) : 0;
    const currencySymbol = listing?.is_tkt_listing ? "TKT" : "SUI";

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8"><Button asChild variant="outline" className="glass-card"><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace</Link></Button></div>
                <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                    <div className="lg:col-span-3">
                        <Card className="overflow-hidden shadow-2xl rounded-2xl">
                            {/* --- CORRECCIÓN: Usa la prop simple `nft.imageUrl` --- */}
                            <img src={nft.imageUrl} alt={nft.name} className="w-full h-auto object-cover aspect-video" />
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="glass-card">
                            {/* --- CORRECCIÓN: Usa las props simples `nft.name` y `nft.description` --- */}
                            <CardHeader><CardTitle className="text-4xl font-bold pt-4 text-foreground">{nft.name}</CardTitle><CardDescription className="text-base pt-2">{nft.description}</CardDescription></CardHeader>
                            <CardContent>
                                <div className="p-4 border rounded-lg bg-background/50 space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase">{listing ? 'Seller' : 'Owner'}</Label>
                                    <div className='flex items-center gap-2'>
                                        {isResale ? (
                                            <><Store className="w-5 h-5 text-primary" /><p className="font-mono text-sm text-foreground truncate">{listing?.seller}</p></>
                                        ) : (
                                            <Link href={`/provider/${nft.provider_id}`} className="font-semibold text-primary hover:underline flex items-center"><BadgeCheck className="w-5 h-5 mr-2"/> Original Creator</Link>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {listing && (
                            <Card className="glass-card">
                               <CardContent className="p-6 space-y-6">
                                    <div className="flex justify-between items-center"><div className="text-muted-foreground">Price</div><div className="text-3xl font-bold text-foreground">{price.toLocaleString('en-US')} {currencySymbol}</div></div>
                                    <div className="pt-4">
                                        <Button size="lg" className="w-full text-lg py-7 btn-sui" onClick={handlePurchase} disabled={isPending || !currentAccount || !listing.is_available || isOwner}>
                                            <ShoppingCart className="w-6 h-6 mr-3" />
                                            {isPending ? "Processing..." : (currentAccount ? (isOwner ? "This is Your Listing" : "Buy Now") : "Connect Wallet to Buy")}
                                        </Button>
                                        {!listing.is_available && <p className="text-center text-destructive mt-2 font-semibold">This item is no longer available.</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        <Card className="glass-card">
                             <CardHeader><CardTitle className="text-md font-semibold text-foreground">Key Details</CardTitle></CardHeader>
                             <CardContent className="space-y-4 text-sm">
                                 <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-500" /><span className="text-muted-foreground">Verifiable on-chain asset</span></div>
                                 <div className="flex items-center gap-3"><Zap className="w-5 h-5 text-blue-500" /><span className="text-muted-foreground">Instant delivery upon purchase</span></div>
                                 <div className="flex items-center gap-3"><Store className="w-5 h-5 text-purple-500" /><span className="text-muted-foreground">Supports secondary market royalties</span></div>
                             </CardContent>
                         </Card>
                        {nft.evolution_rules && nft.evolution_rules.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-foreground">Evolutions</h3>
                                {nft.evolution_rules.map((rule, index) => (
                                    // --- CORRECCIÓN: Usa las props simples ---
                                    <EvolutionCard key={index} rule={rule} nftId={nft.id} providerProfile={providerProfile} currentImageUrl={nft.imageUrl} onEvolveSuccess={() => queryClient.invalidateQueries({ queryKey: ['getObject', objectId]})} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}