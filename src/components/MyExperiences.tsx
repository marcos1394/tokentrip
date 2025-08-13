'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSuiClientQuery, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { ExperienceNftCard } from './ExperienceNftCard';
import { Loader, Ticket, Sprout, Star, Repeat, Inbox, Store } from 'lucide-react';
import { suiConfig } from '@/config/sui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Transaction } from '@mysten/sui/transactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';

// --- Interfaces ---
interface PurchaseReceiptFields {
  id: { id: string };
  listing_id: string;
  provider_id: string;
  nft_name: string;
  nft_image_url: { url: string };
}
interface ProviderProfile {
  id: { id: string };
}

// --- Sub-componente del Botón de Venta ---
function SellButton({ nftId, isProvider, onSell, isPending }: { nftId: string, isProvider: boolean, onSell: (id: string, price: string) => void, isPending: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [price, setPrice] = useState('');

    const buttonText = isProvider ? "Sell" : "Resell";
    const buttonIcon = isProvider ? <Store className="w-4 h-4 mr-2" /> : <Repeat className="w-4 h-4 mr-2" />;
    const dialogTitle = isProvider ? "List for Sale" : "List for Resale";
    const dialogDescription = isProvider ? "Set the initial price in SUI for this experience." : "Set the price in SUI to resell this experience.";

    const handleConfirm = () => {
        onSell(nftId, price);
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full card-hover glass-card">{buttonIcon} {buttonText}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-effect">
                <DialogHeader>
                    <DialogTitle className="text-foreground">{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="price" className="text-muted-foreground">Price (SUI)</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2" placeholder="e.g., 50.0" />
                </div>
                <DialogFooter>
                    <Button onClick={handleConfirm} disabled={isPending} className="w-full btn-sui">
                        {isPending && <Loader className="w-4 h-4 mr-2 animate-spin"/>}
                        Confirm & List
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Sub-componente de Carga ---
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ))}
        </div>
    );
}

// --- Componente Principal ---
export function MyExperiences() {
    const currentAccount = useCurrentAccount();
    const params = useParams();
    const locale = params.locale as string || 'en';
    const [cardsVisible, setCardsVisible] = useState(false);
    const { toast } = useToast();
    const { mutateAsync: executeTransaction, isPending: isTransactionPending } = useSignAndExecuteTransaction();

    const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery('getOwnedObjects', {
        owner: currentAccount?.address!,
        filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` },
        limit: 1,
        options: { showContent: true }
    }, { enabled: !!currentAccount });
    
    const providerProfileId = useMemo(() => providerData?.data?.[0]?.data?.objectId, [providerData]);
    
    const { data: nftsData, isLoading: isLoadingNfts, refetch: refetchNfts } = useSuiClientQuery(
        'getOwnedObjects', 
        { 
            owner: currentAccount?.address!,
            filter: { StructType: `${suiConfig.packageId}::experience_nft::ExperienceNFT` },
            options: { showDisplay: true, showContent: true } 
        },
        { enabled: !!currentAccount }
    );

    const { data: receiptsData, isLoading: isLoadingReceipts } = useSuiClientQuery(
        'getOwnedObjects', 
        { 
            owner: currentAccount?.address!,
            filter: { StructType: `${suiConfig.packageId}::experience_nft::PurchaseReceipt` },
            options: { showContent: true }
        },
        { enabled: !!currentAccount }
    );
    
    const isLoading = isLoadingNfts || isLoadingReceipts || isLoadingProfile;
    const ownedNfts = nftsData?.data ?? [];
    const reviewablePurchases = receiptsData?.data ?? [];

    useEffect(() => {
        if (nftsData || receiptsData) {
            setTimeout(() => setCardsVisible(true), 100);
        }
    }, [nftsData, receiptsData]);
    
    const handleSell = async (nftId: string, price: string) => {
        const priceAsNumber = parseFloat(price);
        if (isNaN(priceAsNumber) || priceAsNumber <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Price' });
            return;
        }

        const tx = new Transaction();
        const SUI_CLOCK_OBJECT_ID = '0x6';
        
        let targetFunction: string;
        let args: any[];

        if (providerProfileId) {
            targetFunction = `${suiConfig.packageId}::experience_nft::list_for_sale`;
            args = [
                tx.object(providerProfileId),
                tx.object(nftId),
                tx.pure.u64(BigInt(priceAsNumber * 1_000_000_000)),
                tx.object(SUI_CLOCK_OBJECT_ID)
            ];
            toast({ title: 'Listing for primary sale...' });
        } else {
            targetFunction = `${suiConfig.packageId}::experience_nft::list_for_resale`;
            args = [
                tx.object(nftId),
                tx.pure.u64(BigInt(priceAsNumber * 1_000_000_000)),
                tx.object(SUI_CLOCK_OBJECT_ID)
            ];
            toast({ title: 'Listing for resale...' });
        }

        tx.moveCall({ target: targetFunction, arguments: args });

        try {
            await executeTransaction({ transaction: tx });
            toast({ title: '✅ Success!', description: 'Your experience is now listed.' });
            refetchNfts();
        } catch (err: any) {
            toast({ variant: 'destructive', title: '❌ Listing Failed', description: err.message });
        }
    };

    if (!currentAccount) return null;
    if (isLoading) return ( <div className="py-16"><LoadingSkeleton /></div> );

    if (ownedNfts.length === 0 && reviewablePurchases.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="glass-card border-2 border-dashed border-primary/20 rounded-2xl p-12 max-w-lg mx-auto">
                    <Ticket className="w-16 h-16 text-primary mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-foreground mb-3">No Digital Assets Found</h3>
                    <p className="text-muted-foreground leading-relaxed">Explore the marketplace to acquire your first experience NFT or purchase receipt!</p>
                </div>
            </div>
        );
    }

    return (
        <Tabs defaultValue="collection" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="collection">My Collection</TabsTrigger>
                <TabsTrigger value="reviews" className="relative">
                    Pending Reviews
                    {reviewablePurchases.length > 0 && <span className="absolute top-0 right-0 -mt-1 -mr-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">{reviewablePurchases.length}</span>}
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="collection" className="mt-6">
                {ownedNfts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {ownedNfts.map((nft, index) => {
                            const objectId = nft.data?.objectId;
                            if (!objectId) return null;

                            const displayData = nft.data?.display?.data;
                            const contentFields = nft.data?.content?.dataType === 'moveObject' ? nft.data.content.fields as any : null;
                            
                            const contentTypeAttr = contentFields?.attributes?.find(
                                (attr: any) => attr.fields.key === 'content-type'
                            );
                            const contentType = contentTypeAttr ? contentTypeAttr.fields.value : 'application/octet-stream';
                            
                            const imageBlobObjectId = contentFields?.image_blob_object_id;
                            const imageUrl = imageBlobObjectId 
                                ? `https://aggregator.testnet.walrus.atalma.io/v1/blobs/by-object-id/${imageBlobObjectId}`
                                : (displayData?.image_url || '');

                            const name = displayData?.name || 'Untitled NFT';

                            return (
                                <div key={objectId} className={`flex flex-col gap-2 transform transition-all duration-700 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                                    <ExperienceNftCard 
                                        nftId={objectId} 
                                        name={name} 
                                        imageUrl={imageUrl}
                                        contentType={contentType}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button asChild variant="outline" className="w-full card-hover glass-card">
                                            <Link href={`/${locale}/fractionalize/${objectId}`}><Sprout className="w-4 h-4 mr-2" /> Fractionalize</Link>
                                        </Button>
                                        <SellButton 
                                            nftId={objectId} 
                                            isProvider={!!providerProfileId} 
                                            onSell={handleSell} 
                                            isPending={isTransactionPending} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                        <Inbox className="w-12 h-12" />
                        <p className="text-lg font-semibold">Your Collection is Empty</p>
                        <p>Purchase an experience from the marketplace to start.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
                 {reviewablePurchases.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviewablePurchases.map((receipt, index) => {
                            if (receipt.data?.content?.dataType !== 'moveObject') return null;
                            const fields = receipt.data.content.fields as unknown as PurchaseReceiptFields;
                            const receiptId = receipt.data.objectId;
                            return (
                                <div key={receiptId} className={`flex flex-col gap-2 transform transition-all duration-700 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                                    <Card className="glass-card h-full flex flex-col overflow-hidden">
                                        <CardHeader className="p-0"><img src={fields.nft_image_url.url} alt={fields.nft_name} className="w-full h-48 object-cover"/></CardHeader>
                                        <CardContent className="p-4 flex-grow">
                                            <p className="text-sm text-muted-foreground">Purchase Completed</p>
                                            <CardTitle className="text-foreground line-clamp-2">{fields.nft_name}</CardTitle>
                                        </CardContent>
                                    </Card>
                                    <Button asChild className="w-full btn-sui">
                                        <Link href={`/review/${receiptId}`}><Star className="w-4 h-4 mr-2" /> Leave a Review</Link>
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                 ) : (
                    <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                        <Star className="w-12 h-12" />
                        <p className="text-lg font-semibold">All Caught Up!</p>
                        <p>You have no pending reviews.</p>
                    </div>
                 )}
            </TabsContent>
        </Tabs>
    );
}
