'use client';

import { useEffect, useState } from 'react';
import { useSuiClientQuery, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { ExperienceNftCard } from './ExperienceNftCard';
import { AlertCircle, Loader, Ticket, Sprout, Star, Repeat, Inbox } from 'lucide-react';
import { suiConfig } from '@/config/sui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { SuiObjectResponse } from '@mysten/sui/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Transaction } from '@mysten/sui/transactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';

// --- Interfaces ---
interface ExperienceNftFields {
    id: { id: string }; name: string; image_url: { url: string }; description: string;
}
interface PurchaseReceiptFields {
    id: { id: string }; listing_id: string; provider_id: string; nft_name: string; nft_image_url: { url: string };
}

// --- Sub-componentes para mejorar la legibilidad ---

function ResaleButton({ nftId, onResale, isPending }: { nftId: string, onResale: (id: string, price: string) => void, isPending: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [price, setPrice] = useState('');
    const handleConfirm = () => {
        onResale(nftId, price);
        setIsOpen(false);
    }
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full card-hover glass-card"><Repeat className="w-4 h-4 mr-2" /> Resell</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-effect">
                <DialogHeader>
                    <DialogTitle className="text-foreground">List for Resale</DialogTitle>
                    <DialogDescription>Set the price in SUI to resell this experience.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="price" className="text-muted-foreground">Resale Price (SUI)</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2" placeholder="e.g., 150.0" />
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


export function MyExperiences() {
    const currentAccount = useCurrentAccount();
    const [cardsVisible, setCardsVisible] = useState(false);
    const { toast } = useToast();
    const { mutateAsync: executeResale, isPending: isResalePending } = useSignAndExecuteTransaction();

    const EXPERIENCE_NFT_TYPE = `${suiConfig.packageId}::experience_nft::ExperienceNFT`;
    const RECEIPT_TYPE = `${suiConfig.packageId}::experience_nft::PurchaseReceipt`;

    const { data, isLoading, isError, error, refetch } = useSuiClientQuery(
        'getOwnedObjects', { owner: currentAccount?.address!, options: { showContent: true, showDisplay: true } },
        { enabled: !!currentAccount, queryKey: ['my-assets', currentAccount?.address] }
    );

    useEffect(() => {
        if (data) setTimeout(() => setCardsVisible(true), 100);
    }, [data]);

    const handleResale = async (nftId: string, price: string) => {
        const priceAsNumber = parseFloat(price);
        if (isNaN(priceAsNumber) || priceAsNumber <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Price' });
            return;
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::list_for_resale`,
            arguments: [ tx.object(nftId), tx.pure.u64(BigInt(priceAsNumber * 1_000_000_000)) ]
        });

        try {
            await executeResale({ transaction: tx });
            toast({ title: '✅ Success!', description: 'Your experience is now listed for resale.'});
            refetch();
        } catch (err: any) {
            toast({ variant: 'destructive', title: '❌ Resale Failed', description: err.message });
        }
    }

    if (!currentAccount) return null;
    if (isLoading) return ( <div className="py-16"><LoadingSkeleton /></div> );
    if (isError) return ( <div className="text-center py-10 text-destructive">{error?.message}</div> );

    const allOwnedObjects = data?.data ?? [];
    const ownedNfts = allOwnedObjects.filter((obj: SuiObjectResponse) => obj.data?.content?.dataType === 'moveObject' && obj.data.content.type === EXPERIENCE_NFT_TYPE);
    const reviewablePurchases = allOwnedObjects.filter((obj: SuiObjectResponse) => obj.data?.content?.dataType === 'moveObject' && obj.data.content.type === RECEIPT_TYPE);

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
                            if (nft.data?.content?.dataType !== 'moveObject') return null;
                            const fields = nft.data.content.fields as unknown as ExperienceNftFields;
                            const objectId = nft.data.objectId;
                            return (
                                <div key={objectId} className={`flex flex-col gap-2 transform transition-all duration-700 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                                    <ExperienceNftCard nftId={objectId} name={fields.name} imageUrl={fields.image_url.url} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button asChild variant="outline" className="w-full card-hover glass-card"><Link href={`/fractionalize/${objectId}`}><Sprout className="w-4 h-4 mr-2" /> Fractionalize</Link></Button>
                                        <ResaleButton nftId={objectId} onResale={handleResale} isPending={isResalePending} />
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