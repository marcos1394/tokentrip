'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader, Gavel, User, Timer, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Interfaces
interface NftFields {
    name: string;
    description: string;
    image_url: { url: string };
}
interface AuctionFields {
    nft: { fields: NftFields };
    highest_bid: string;
    highest_bidder: string;
    end_timestamp_ms: string;
    is_settled: boolean;
}

// Componente de Cuenta Regresiva
function Countdown({ endTime }: { endTime: number }) {
    const [timeLeft, setTimeLeft] = useState(endTime - Date.now());
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(endTime - Date.now()), 1000);
        return () => clearInterval(timer);
    }, [endTime, timeLeft]);

    if (timeLeft <= 0) return <span className="text-destructive font-bold">¡Finalizada!</span>;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return <span>{days > 0 && `${days}d `}{hours}h {minutes}m {seconds}s</span>;
}

export default function AuctionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const auctionId = params.auctionId as string;
    const locale = params.locale as string;
    
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    
    const [bidAmount, setBidAmount] = useState('');

    const { mutate: executeBid, isPending: isBidPending } = useSignAndExecuteTransaction();
    // --- NUEVO: Hook de transacción para la liquidación ---
    const { mutate: executeSettle, isPending: isSettlePending } = useSignAndExecuteTransaction();
    
    const { data: auctionData, isLoading, isError } = useSuiClientQuery(
        'getObject', { id: auctionId, options: { showContent: true } }, { queryKey: ['auction', auctionId] }
    );

    const auction = auctionData?.data?.content?.dataType === 'moveObject' ? auctionData.data.content.fields as unknown as AuctionFields : null;

    const handlePlaceBid = () => {
        if (!currentAccount?.address || !auction) return;
        const currentHighestBid = BigInt(auction.highest_bid);
        const bidAmountInMist = BigInt(parseFloat(bidAmount) * 1_000_000_000);

        if (isNaN(Number(bidAmountInMist)) || bidAmountInMist <= currentHighestBid) {
            toast({ variant: 'destructive', title: 'Puja inválida', description: `Tu puja debe ser mayor a ${(Number(currentHighestBid) / 1e9).toLocaleString()} SUI.`});
            return;
        }

        const tx = new Transaction();
        const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(bidAmountInMist)]);
        
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::place_bid`,
            arguments: [ tx.object(auctionId), paymentCoin, tx.object("0x6") ],
        });

        executeBid({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ ¡Puja Realizada!', description: 'Eres el postor más alto.'});
                setBidAmount('');
                queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
            },
            onError: (error) => { toast({ variant: 'destructive', title: '❌ Error al Pujar', description: error.message }); }
        });
    };

    // --- NUEVO: Lógica para la transacción de Liquidación ---
    const handleSettleAuction = () => {
        if (!auction) return;
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::settle_auction`,
            arguments: [
                tx.object(auctionId),
                tx.object(suiConfig.treasuryCapId),
                tx.object("0x6") // Clock object
            ]
        });

        executeSettle({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ ¡Subasta Liquidada!', description: 'El NFT y los fondos han sido transferidos.' });
                // Como el objeto Auction se destruye, es buena idea redirigir
                setTimeout(() => router.push(`/${locale}/auctions`), 2500);
            },
            onError: (error) => {
                toast({ variant: 'destructive', title: '❌ Error al Liquidar', description: error.message });
            }
        });
    }

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
    if (isError || !auction) return <div className="min-h-screen flex items-center justify-center">Subasta no encontrada o ya liquidada.</div>;
    
    const highestBidInSui = Number(auction.highest_bid) / 1_000_000_000;
    const isAuctionOver = new Date() >= new Date(Number(auction.end_timestamp_ms));
    const canBeSettled = isAuctionOver && !auction.is_settled;

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href={`/${locale}/auctions`}><ArrowLeft className="w-4 h-4 mr-2" /> Volver a Subastas</Link>
                    </Button>
                </div>
                <div className="grid lg:grid-cols-5 gap-12">
                    <div className="lg:col-span-3">
                        <Card className="overflow-hidden shadow-2xl rounded-2xl">
                            <img src={auction.nft.fields.image_url.url} alt={auction.nft.fields.name} className="w-full h-auto object-cover aspect-video" />
                        </Card>
                         <Card className="glass-card mt-8">
                            <CardHeader><CardTitle className="text-foreground">Descripción</CardTitle></CardHeader>
                            <CardContent><p className="text-foreground/80">{auction.nft.fields.description}</p></CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-3xl font-bold text-foreground">{auction.nft.fields.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 border rounded-lg bg-background/50">
                                    <Label className="text-sm text-muted-foreground">Puja Actual</Label>
                                    <p className="text-4xl font-bold text-primary">{highestBidInSui.toLocaleString()} SUI</p>
                                </div>
                                <div className="p-4 border rounded-lg bg-background/50">
                                    <Label className="text-sm text-muted-foreground">Termina en</Label>
                                    <p className="text-2xl font-bold text-foreground"><Countdown endTime={Number(auction.end_timestamp_ms)} /></p>
                                </div>
                                {auction.highest_bidder !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
                                <div className="p-4 border rounded-lg bg-background/50">
                                    <Label className="text-sm text-muted-foreground">Mejor Postor</Label>
                                    <p className="font-mono text-xs text-foreground truncate">{auction.highest_bidder}</p>
                                </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        {!isAuctionOver && !auction.is_settled && (
                            <Card className="glass-card border-primary/50">
                                <CardHeader><CardTitle className="text-foreground">Realiza tu Puja</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <Input type="number" placeholder={`> ${highestBidInSui.toLocaleString()} SUI`} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                                    <Button size="lg" className="w-full btn-sui" onClick={handlePlaceBid} disabled={!currentAccount || isBidPending}>
                                        {isBidPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Gavel className="w-5 h-5 mr-2" />}
                                        {currentAccount ? 'Realizar Puja' : 'Conecta tu billetera'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        
                        {isAuctionOver && (
                             <Card className={`glass-card text-center p-6 transition-all ${canBeSettled ? 'border-amber-500/50' : (auction.is_settled ? 'border-green-500/30' : '')}`}>
                                {auction.is_settled ? <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4"/> : <Timer className="w-12 h-12 mx-auto text-amber-500 mb-4"/>}
                                <CardTitle className="text-foreground">{auction.is_settled ? "Subasta Liquidada" : "Subasta Finalizada"}</CardTitle>
                                <CardDescription>{auction.is_settled ? "Los activos han sido transferidos." : "Esta subasta ya no acepta más pujas."}</CardDescription>
                            </Card>
                        )}

                        {canBeSettled && (
                            <div className="pt-4">
                                 <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleSettleAuction} disabled={isSettlePending || !currentAccount}>
                                    <Zap className="w-5 h-5 mr-2" />
                                    {isSettlePending ? "Liquidando..." : "Liquidar Subasta"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Toaster/>
        </div>
    );
}