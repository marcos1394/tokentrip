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
import { ArrowLeft, Loader, Gavel, User, Timer, CheckCircle, Info, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interfaces
interface NftFields {
    name: string;
    description: string;
    image_url: { url: string };
}

// Reemplaza esta interfaz en tu archivo
interface AuctionFields {
    id: { id: string };
    nft: { 
        type: string,
        fields: { 
            some?: {
                fields: {
                    name: string;
                    description: string;
                    image_url: { fields: { url: string } };
                }
            }
        } 
    };
    highest_bid: string;
    highest_bidder: { fields: { some?: [string] } };
    end_timestamp_ms: string;
    start_price: string;
    is_settled: boolean;
    is_tkt_auction: boolean; // Campo clave que faltaba
    seller: string; // Campo clave que faltaba
}

// Componente de Cuenta Regresiva (Traducido)
function Countdown({ endTime }: { endTime: number }) {
    const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(endTime - Date.now()), 1000);
        return () => clearInterval(timer);
    }, [endTime, timeLeft]);

    if (timeLeft <= 0) return <span className="text-destructive font-bold">Ended!</span>;

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
    
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    
    const [bidAmount, setBidAmount] = useState('');

    const { mutateAsync: executeBid, isPending: isBidPending } = useSignAndExecuteTransaction();
    const { mutateAsync: executeSettle, isPending: isSettlePending } = useSignAndExecuteTransaction();
    
    const { data: auctionData, isLoading, isError } = useSuiClientQuery('getObject', { id: auctionId, options: { showContent: true } }, { queryKey: ['auction', auctionId], refetchInterval: 5000 }); // Refresca cada 5s

    const auction = auctionData?.data?.content?.dataType === 'moveObject' ? auctionData.data.content.fields as unknown as AuctionFields : null;

    const handlePlaceBid = async () => {
        // --- 1. VALIDACIONES INICIALES ---
        if (!currentAccount?.address || !auction) {
            toast({ variant: "destructive", title: "Cannot Place Bid", description: "Wallet is not connected or auction data is missing." });
            return;
        }

        if (currentAccount.address === auction.seller) {
            toast({ variant: "destructive", title: "Action Not Allowed", description: "You cannot bid on your own auction." });
            return;
        }

        const bidAmountNum = parseFloat(bidAmount);
        if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
            toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a positive number to bid." });
            return;
        }

        // --- 2. VALIDACIÓN DE MONTO (usando BigInt para precisión) ---
        const bidAmountInMist = BigInt(Math.floor(bidAmountNum * 1e9));
        const highestBid = BigInt(auction.highest_bid);
        const startPrice = BigInt(auction.start_price);
        
        const threshold = auction.highest_bidder ? highestBid : startPrice;
        const currencySymbol = auction.is_tkt_auction ? "TKT" : "SUI";

        if (bidAmountInMist <= threshold) {
            const requiredAmount = (Number(threshold) / 1e9);
            toast({ variant: 'destructive', title: 'Bid Too Low', description: `Your bid must be higher than ${requiredAmount.toLocaleString()} ${currencySymbol}.`});
            return;
        }

        // --- 3. CONSTRUCCIÓN DE LA TRANSACCIÓN ---
        const tx = new Transaction();
        const isTkt = auction.is_tkt_auction;

        if (isTkt) {
            // --- LÓGICA PARA PUJAS CON TKT ---
            const tktCoinType = `${suiConfig.tktPackageId}::tkt::TKT`;
            const { data: userTktCoins } = await suiClient.getCoins({ owner: currentAccount.address, coinType: tktCoinType });

            if (!userTktCoins || userTktCoins.length === 0) {
                toast({ variant: "destructive", title: "Insufficient TKT Balance", description: "You have no TKT coins to use for bidding." });
                return;
            }
            
            const totalTktBalance = userTktCoins.data.reduce((acc, coin) => acc + BigInt(coin.balance), 0n);
            if (totalTktBalance < bidAmountInMist) {
                toast({ variant: "destructive", title: "Insufficient TKT Balance", description: `You need at least ${bidAmountNum} TKT to place this bid.` });
                return;
            }

            // Prepara la moneda TKT para el pago
            const [mainCoin, ...otherCoins] = userTktCoins.data;
            const mainCoinObject = tx.object(mainCoin.coinObjectId);
            if (otherCoins.length > 0) {
                tx.mergeCoins(mainCoinObject, otherCoins.map(c => tx.object(c.coinObjectId)));
            }
            const [paymentCoin] = tx.splitCoins(mainCoinObject, [tx.pure.u64(bidAmountInMist)]);
            
            tx.moveCall({
                target: `${suiConfig.auctionsPackageId}::auctions::place_bid_tkt`,
                arguments: [ tx.object(auctionId), paymentCoin, tx.object("0x6") ],
            });

        } else {
            // --- LÓGICA PARA PUJAS CON SUI ---
            const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(bidAmountInMist)]);
            tx.moveCall({
                target: `${suiConfig.auctionsPackageId}::auctions::place_bid`,
                arguments: [ tx.object(auctionId), paymentCoin, tx.object("0x6") ],
            });
        }
        
        // --- 4. EJECUCIÓN DE LA TRANSACCIÓN ---
        try {
            await executeBid({ transaction: tx });
            toast({ title: '✅ Bid Placed!', description: "You are now the highest bidder."});
            setBidAmount('');
            queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Bid Failed', description: error.message || "An unknown error occurred." });
        }
    };
   
    // Reemplaza esta función completa
    const handleSettleAuction = async () => {
        if (!auction) return;

        const tx = new Transaction();
        
        if (auction.is_tkt_auction) {
            tx.moveCall({
                target: `${suiConfig.auctionsPackageId}::auctions::settle_tkt_auction`,
                arguments: [
                    tx.object(auctionId),
                    tx.object(suiConfig.daoTreasuryId),
                    tx.object(suiConfig.tktTreasuryCapId),
                    tx.object("0x6")
                ],
            });
        } else {
            tx.moveCall({
                target: `${suiConfig.auctionsPackageId}::auctions::settle_sui_auction`,
                arguments: [
                    tx.object(auctionId),
                    tx.object("0x6")
                ],
            });
        }

        try {
            await executeSettle({ transaction: tx });
            toast({ title: '✅ Auction Settled!', description: 'The assets have been transferred.' });
            setTimeout(() => router.push(`/auctions`), 2500);
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Settle Failed', description: error.message });
        }
    }
    // --- Renderizado y Lógica de UI ---
    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10" /></div>;
    if (isError || !auction) return <div className="min-h-screen flex items-center justify-center text-center p-4">Auction not found or it has been settled.</div>;
    
    const highestBidInSui = Number(auction.highest_bid) / 1_000_000_000;
    const isAuctionOver = new Date() >= new Date(Number(auction.end_timestamp_ms));
    const canBeSettled = isAuctionOver && !auction.is_settled;

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/auctions"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Auctions</Link>
                    </Button>
                </div>
                <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                    
                    {/* Columna Izquierda: Imagen y Descripción */}
                    <div className="lg:col-span-3 space-y-8">
                        <Card className="overflow-hidden shadow-2xl rounded-2xl">
                            <img src={auction.nft.fields.image_url.url} alt={auction.nft.fields.name} className="w-full h-auto object-cover aspect-video" />
                        </Card>
                         <Card className="glass-card">
                            <CardHeader><CardTitle className="text-foreground">Description</CardTitle></CardHeader>
                            <CardContent><p className="text-foreground/80 whitespace-pre-wrap">{auction.nft.fields.description}</p></CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Detalles y Acciones */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-3xl font-bold text-foreground">{auction.nft.fields.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 border rounded-lg bg-background/50 text-center">
                                    <Label className="text-sm text-muted-foreground">CURRENT BID</Label>
                                    <p className="text-4xl font-bold text-primary">{highestBidInSui.toLocaleString('en-US')} SUI</p>
                                </div>
                                <div className="p-4 border rounded-lg bg-background/50 text-center">
                                    <Label className="text-sm text-muted-foreground">AUCTION ENDS IN</Label>
                                    <p className="text-2xl font-bold text-foreground"><Countdown endTime={Number(auction.end_timestamp_ms)} /></p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Pestañas para organizar Acciones y Detalles */}
                        <Tabs defaultValue="action" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="action" disabled={isAuctionOver}>Bid</TabsTrigger>
                                <TabsTrigger value="details">Details</TabsTrigger>
                            </TabsList>
                            <TabsContent value="action" className="mt-4">
                                {!isAuctionOver && (
                                    <Card className="glass-card border-primary/50">
                                        <CardHeader><CardTitle className="text-foreground">Place Your Bid</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <Input type="number" placeholder={`> ${highestBidInSui.toLocaleString('en-US')} SUI`} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                                            <Button size="lg" className="w-full btn-sui" onClick={handlePlaceBid} disabled={!currentAccount || isBidPending}>
                                                {isBidPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Gavel className="w-5 h-5 mr-2" />}
                                                {currentAccount ? 'Place Bid' : 'Connect Wallet to Bid'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                                {isAuctionOver && !auction.is_settled && (
                                     <Card className="glass-card text-center p-6 border-amber-500/50">
                                        <Timer className="w-12 h-12 mx-auto text-amber-500 mb-4"/>
                                        <CardTitle className="text-foreground">Auction Has Ended</CardTitle>
                                        <CardDescription>Bidding is now closed. This auction can be settled.</CardDescription>
                                    </Card>
                                )}
                            </TabsContent>
                            <TabsContent value="details" className="mt-4">
                                 <Card className="glass-card">
                                    <CardContent className="pt-6">
                                    {auction.highest_bidder !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? (
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Highest Bidder</Label>
                                            <p className="font-mono text-xs text-foreground break-all">{auction.highest_bidder}</p>
                                        </div>
                                    ) : (
                                        <p className='text-muted-foreground text-sm'>No bids placed yet.</p>
                                    )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {auction.is_settled && (
                            <Card className="glass-card text-center p-6 border-green-500/30">
                                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4"/>
                                <CardTitle className="text-foreground">Auction Settled</CardTitle>
                                <CardDescription>The assets have been transferred.</CardDescription>
                            </Card>
                        )}

                        {canBeSettled && (
                            <div className="pt-4">
                                <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleSettleAuction} disabled={isSettlePending || !currentAccount}>
                                    <Zap className="w-5 h-5 mr-2" />
                                    {isSettlePending ? "Settling..." : "Settle Auction"}
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
