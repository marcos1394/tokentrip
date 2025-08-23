'use client';

import { useMemo, useState } from 'react';
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
import { 
  ArrowLeft, 
  ShoppingCart, 
  Loader, 
  Store, 
  BadgeCheck, 
  ShieldCheck, 
  Zap,
  Heart,
  Share2,
  Eye,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Crown,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EvolutionCard } from '@/components/EvolutionCard';

// --- INTERFACES HOMOLOGADAS ---
interface NormalizedNft {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  provider_address: string;
  provider_id: string;
  evolution_rules: any[];
}

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
    
    // Estados locales para mejores interacciones
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

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
            toast({ 
                title: "🎉 Purchase Successful!", 
                description: "Your NFT has been transferred to your wallet."
            });
            queryClient.invalidateQueries({ queryKey: ['getObject', objectId] });
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "❌ Purchase Failed", 
                description: error.message 
            });
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `${type} copied to clipboard!` });
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: nft.name,
                text: nft.description,
                url: window.location.href
            });
        } else {
            copyToClipboard(window.location.href, "Link");
        }
    };

    const isResale = useMemo(() => listing ? listing.seller !== nft.provider_address : false, [listing, nft]);
    const isOwner = useMemo(() => listing ? listing.seller === currentAccount?.address : nft.provider_address === currentAccount?.address, [listing, nft, currentAccount]);
    
    const price = listing ? Number(listing.price) / (10 ** 9) : 0;
    const currencySymbol = listing?.is_tkt_listing ? "TKT" : "SUI";

    // Truncar descripción si es muy larga
    const shouldTruncateDescription = nft.description.length > 200;
    const displayDescription = shouldTruncateDescription && !showFullDescription 
        ? nft.description.substring(0, 200) + "..." 
        : nft.description;

    return (
        <TooltipProvider>
            <div className="min-h-screen pt-16 pb-12 bg-gradient-to-br from-background via-background to-muted/20">
                <AnimatedBackground />
                
                {/* Header con navegación mejorada */}
                <div className="sticky top-16 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <Button asChild variant="ghost" className="hover:bg-primary/10 transition-colors">
                                <Link href="/" className="flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Back to Marketplace</span>
                                    <span className="sm:hidden">Back</span>
                                </Link>
                            </Button>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsLiked(!isLiked)}
                                    className="hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleShare}
                                    className="hover:bg-blue-50 hover:text-blue-500 transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8 relative z-10">
                    <div className="grid xl:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
                        {/* Columna principal de imagen - Mejorada */}
                        <div className="xl:col-span-2 lg:col-span-3">
                            <div className="sticky top-32">
                                <Card className="overflow-hidden shadow-2xl rounded-3xl border-0 bg-gradient-to-br from-card via-card to-muted/20">
                                    <div className="relative group">
                                        {!isImageLoaded && (
                                            <div className="absolute inset-0 bg-muted/20 animate-pulse rounded-3xl flex items-center justify-center">
                                                <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                        <img 
                                            src={nft.imageUrl} 
                                            alt={nft.name} 
                                            className={`w-full h-auto object-cover aspect-square transition-all duration-500 ${
                                                isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                            }`}
                                            onLoad={() => setIsImageLoaded(true)}
                                        />
                                        
                                        {/* Overlay con información adicional */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Eye className="w-4 h-4" />
                                                    <span>Click to view full size</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Información técnica del NFT */}
                                <Card className="mt-6 glass-card border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-green-500" />
                                            NFT Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                            <span className="text-muted-foreground">Token ID</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs bg-background px-2 py-1 rounded">
                                                    {nft.id.substring(0, 8)}...
                                                </code>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => copyToClipboard(nft.id, "Token ID")}
                                                            className="h-6 w-6 p-0 hover:bg-primary/10"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Copy full ID</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                            <span className="text-muted-foreground">Network</span>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                                Sui Network
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Columna de detalles - Completamente rediseñada */}
                        <div className="xl:col-span-1 lg:col-span-2 space-y-6">
                            {/* Card principal del NFT */}
                            <Card className="glass-card border-0 shadow-xl overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                                                {nft.name}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="text-xs">
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                    Experience NFT
                                                </Badge>
                                                {isResale && (
                                                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                                        Resale
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {listing?.is_available && (
                                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Available
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-6">
                                    {/* Descripción mejorada */}
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                            Description
                                        </Label>
                                        <p className="text-foreground leading-relaxed">
                                            {displayDescription}
                                        </p>
                                        {shouldTruncateDescription && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => setShowFullDescription(!showFullDescription)}
                                                className="p-0 h-auto text-primary hover:text-primary/80 mt-2"
                                            >
                                                {showFullDescription ? "Show less" : "Read more"}
                                            </Button>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Información del propietario/vendedor mejorada */}
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                                            {listing ? 'Seller' : 'Creator'}
                                        </Label>
                                        
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-3">
                                                {isResale ? (
                                                    <>
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                                <Store className="w-4 h-4" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-sm">Collector</p>
                                                            <code className="text-xs text-muted-foreground">
                                                                {listing?.seller.substring(0, 12)}...
                                                            </code>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback className="bg-green-100 text-green-700">
                                                                <Crown className="w-4 h-4" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <Link 
                                                                href={`/provider/${nft.provider_id}`}
                                                                className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                Original Creator
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                            <p className="text-xs text-muted-foreground">Verified Provider</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <BadgeCheck className="w-5 h-5 text-green-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card de compra mejorada */}
                            {listing && (
                                <Card className="glass-card border-0 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
                                    <CardContent className="p-6">
                                        {/* Precio destacado */}
                                        <div className="text-center mb-6">
                                            <Label className="text-sm text-muted-foreground mb-2 block">Current Price</Label>
                                            <div className="flex items-baseline justify-center gap-2">
                                                <span className="text-4xl font-bold text-foreground">
                                                    {price.toLocaleString('en-US')}
                                                </span>
                                                <span className="text-lg font-semibold text-primary">
                                                    {currencySymbol}
                                                </span>
                                            </div>
                                            {listing.is_tkt_listing && (
                                                <Badge variant="outline" className="mt-2 bg-purple-50 text-purple-700 border-purple-200">
                                                    <Zap className="w-3 h-3 mr-1" />
                                                    TKT Payment
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Botón de compra mejorado */}
                                        <div className="space-y-4">
                                            {!currentAccount ? (
                                                <Button 
                                                    size="lg" 
                                                    className="w-full text-lg py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                                                >
                                                    <Wallet className="w-5 h-5 mr-2" />
                                                    Connect Wallet to Buy
                                                </Button>
                                            ) : isOwner ? (
                                                <Button 
                                                    size="lg" 
                                                    variant="outline"
                                                    className="w-full text-lg py-6 border-2 border-dashed"
                                                    disabled
                                                >
                                                    <Crown className="w-5 h-5 mr-2" />
                                                    You Own This Item
                                                </Button>
                                            ) : !listing.is_available ? (
                                                <Button 
                                                    size="lg" 
                                                    variant="destructive"
                                                    className="w-full text-lg py-6"
                                                    disabled
                                                >
                                                    <AlertCircle className="w-5 h-5 mr-2" />
                                                    No Longer Available
                                                </Button>
                                            ) : (
                                                <Button 
                                                    size="lg" 
                                                    className="w-full text-lg py-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                                                    onClick={handlePurchase}
                                                    disabled={isPending}
                                                >
                                                    {isPending ? (
                                                        <>
                                                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                                                            Processing Purchase...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShoppingCart className="w-5 h-5 mr-2" />
                                                            Buy Now
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                            {/* Información adicional de la compra */}
                                            {currentAccount && listing.is_available && !isOwner && (
                                                <div className="text-center text-sm text-muted-foreground space-y-1">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>Instant delivery to your wallet</span>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                                                        <span>Secure blockchain transaction</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Features del NFT */}
                            <Card className="glass-card border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Key Features
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <ShieldCheck className="w-5 h-5 text-green-500" />
                                            <div>
                                                <p className="font-medium text-sm">Blockchain Verified</p>
                                                <p className="text-xs text-muted-foreground">Authentic ownership on Sui</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <Zap className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <p className="font-medium text-sm">Instant Transfer</p>
                                                <p className="text-xs text-muted-foreground">Immediate delivery upon purchase</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <Store className="w-5 h-5 text-purple-500" />
                                            <div>
                                                <p className="font-medium text-sm">Resale Ready</p>
                                                <p className="text-xs text-muted-foreground">Trade on secondary markets</p>
                                            </div>
                                        </div>
                                        
                                        {nft.evolution_rules && nft.evolution_rules.length > 0 && (
                                            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                                <Clock className="w-5 h-5 text-orange-500" />
                                                <div>
                                                    <p className="font-medium text-sm">Evolvable</p>
                                                    <p className="text-xs text-muted-foreground">{nft.evolution_rules.length} evolution{nft.evolution_rules.length > 1 ? 's' : ''} available</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sección de evoluciones mejorada */}
                            {nft.evolution_rules && nft.evolution_rules.length > 0 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold text-foreground mb-2">
                                            Evolution Paths
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            Transform your NFT into something new
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {nft.evolution_rules.map((rule, index) => (
                                            <div key={index} className="transform transition-all duration-200 hover:scale-[1.02]">
                                                <EvolutionCard 
                                                    rule={rule} 
                                                    nftId={nft.id} 
                                                    providerProfile={providerProfile} 
                                                    currentImageUrl={nft.imageUrl} 
                                                    onEvolveSuccess={() => queryClient.invalidateQueries({ queryKey: ['getObject', objectId]})} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <Toaster />
            </div>
        </TooltipProvider>
    );
}
