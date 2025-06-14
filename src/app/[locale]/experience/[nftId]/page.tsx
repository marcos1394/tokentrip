'use client';

import { useMemo } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, ShoppingCart, Loader, Store, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// --- INTERFACES ACTUALIZADAS ---
interface NftFields {
    name: string;
    description: string;
    image_url: { url: string };
    provider_address: string; // Dirección del creador original
}
interface ListingFields {
    price: string;
    is_available: boolean;
    is_tkt_listing: boolean;
    seller: string;
    provider_id: string; // ID del perfil del creador
    nft: { fields: NftFields };
}

export default function ExperienceDetailPage() {
    const params = useParams();
    // El ID en la URL debe ser el del Listing
    const listingId = params.nftId as string; 
    const locale = params.locale as string;
    
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    // Hook para obtener los datos del Listing directamente por su ID
    const { data: listingData, isLoading, isError } = useSuiClientQuery('getObject', {
        id: listingId,
        options: { showContent: true }
    });

    const handlePurchase = async () => {
        if (!currentAccount?.address || !listingData?.data) return;

        const fields = listingData.data.content?.dataType === 'moveObject' ? listingData.data.content.fields as unknown as ListingFields : null;
        if (!fields) return;

        const tx = new Transaction();
        const priceInMist = BigInt(fields.price);

        if (fields.is_tkt_listing) {
            // LÓGICA DE COMPRA CON TKT
            const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
            const { data: userTktCoins } = await suiClient.getCoins({ owner: currentAccount.address, coinType: TKT_COIN_TYPE });
            if (!userTktCoins || userTktCoins.length === 0) {
                toast({ variant: "destructive", title: "Fondos Insuficientes", description: "No tienes tokens TKT." });
                return;
            }
            const [mainCoin, ...otherCoins] = userTktCoins;
            const paymentCoin = tx.object(mainCoin.coinObjectId);
            if (otherCoins.length > 0) {
                tx.mergeCoins(paymentCoin, otherCoins.map(c => c.coinObjectId));
            }
            
            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::purchase_with_tkt`,
                arguments: [ tx.object(listingId), paymentCoin ],
            });

        } else {
            // LÓGICA DE COMPRA CON SUI
            const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);
            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::purchase`,
                arguments: [
                    tx.object(listingId),
                    tx.object(suiConfig.treasuryCapId),
                    tx.object(suiConfig.vipRegistryId!),
                    tx.object(suiConfig.stakingPoolId),
                    paymentCoin,
                ],
            });
        }
        
        signAndExecuteTransaction({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: "✅ ¡Compra Exitosa!", description: "Has adquirido la experiencia." });
                queryClient.invalidateQueries({ queryKey: ['get-all-listings-graphql-v5-secondary-market'] });
                queryClient.invalidateQueries({ queryKey: ['my-assets', currentAccount.address] });
            },
            onError: (error) => {
                toast({ variant: "destructive", title: "❌ Error en la Compra", description: error.message });
            }
        });
    };

    const fields = listingData?.data?.content?.dataType === 'moveObject' ? listingData.data.content.fields as unknown as ListingFields : null;

    // Lógica para determinar si es una reventa
    const isResale = useMemo(() => {
        if (!fields) return false;
        return fields.seller !== fields.nft.fields.provider_address;
    }, [fields]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
    if (isError || !fields) return (
        <div className="min-h-screen flex items-center justify-center text-center"><Card className="glass-card p-8"><AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" /><h1 className="text-2xl font-bold text-foreground">Experiencia no Encontrada</h1><p className="mt-2 text-muted-foreground">Este artículo podría haber sido vendido o ya no estar disponible.</p><Button asChild className="mt-6 btn-sui-outline"><Link href={`/${locale}`}>Volver al Marketplace</Link></Button></Card></div>
    );
    
    const currencySymbol = fields.is_tkt_listing ? "TKT" : "SUI";
    const price = Number(fields.price) / (10 ** 9);

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href={`/${locale}`}><ArrowLeft className="w-4 h-4 mr-2" /> Volver al Marketplace</Link>
                    </Button>
                </div>
                <div className="grid lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden shadow-2xl rounded-2xl"><img src={fields.nft.fields.image_url.url} alt={fields.nft.fields.name} className="w-full h-auto object-cover aspect-square" /></Card>
                    </div>
                    <div className="lg:col-span-3">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-4xl font-bold pt-4 text-foreground">{fields.nft.fields.name}</CardTitle>
                                {/* --- NUEVO: Muestra quién es el vendedor --- */}
                                <div className="flex items-center pt-2">
                                    <span className="text-muted-foreground mr-2">Vendido por:</span>
                                    {isResale ? (
                                        <span className="font-mono text-sm text-foreground">{fields.seller.slice(0, 6)}...{fields.seller.slice(-4)}</span>
                                    ) : (
                                        <Link href={`/${locale}/provider/${fields.provider_id}`} className="font-semibold text-primary hover:underline flex items-center">
                                            <BadgeCheck className="w-4 h-4 mr-1"/> Creador Original
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <p className="text-base text-foreground/80">{fields.nft.fields.description}</p>
                                <div className="border-t border-b border-border p-4 rounded-lg bg-background/50">
                                    <div className="flex justify-between items-center">
                                        <div className="text-muted-foreground">Precio</div>
                                        <div className="text-3xl font-bold text-foreground">{price.toLocaleString()} {currencySymbol}</div>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handlePurchase} disabled={isPending || !currentAccount || !fields.is_available}>
                                        <ShoppingCart className="w-6 h-6 mr-3" />
                                        {isPending ? "Procesando..." : (currentAccount ? "Comprar Ahora" : "Conecta tu billetera")}
                                    </Button>
                                    {!fields.is_available && <p className="text-center text-destructive mt-2 font-semibold">Este artículo ya no está disponible.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}