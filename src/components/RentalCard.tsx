'use client';

import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Key } from 'lucide-react';

// Interfaz para un RentalListing que viene del indexer/GraphQL
export interface RentalListing {
    listingId: string;
    owner: string;
    price: string;
    isTktListing: boolean;
    startTime: string;
    endTime: string;
    isRented: boolean;
    // Datos del activo alquilado
    asset: {
        id: string;
        name: string;
        imageUrl: string;
        isFraction: boolean;
    }
}

export function RentalCard({ listing }: { listing: RentalListing }) {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { toast } = useToast();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const price = Number(listing.price) / 1e9;
    const currency = listing.isTktListing ? "TKT" : "SUI";
    const startDate = new Date(Number(listing.startTime)).toLocaleDateString();
    const endDate = new Date(Number(listing.endTime)).toLocaleDateString();

    const handleRent = async () => {
        if (!account) return;

        try {
            const tx = new Transaction();
            const priceInMist = BigInt(listing.price);
            
            if (listing.isTktListing) {
                // --- LÓGICA COMPLETA PARA TKT ---
                const tktCoinType = `${suiConfig.tktPackageId}::tkt::TKT`;
                const { data: userTktCoins } = await suiClient.getCoins({ owner: account.address, coinType: tktCoinType });

                if (!userTktCoins || userTktCoins.length === 0) {
                    throw new Error("You don't have any TKT coins.");
                }
                
                const totalBalance = userTktCoins.reduce((acc, coin) => acc + BigInt(coin.balance), 0n);
                if (totalBalance < priceInMist) {
                    throw new Error("Insufficient TKT balance.");
                }

                const [mainCoin, ...otherCoins] = userTktCoins;
                const mainCoinObject = tx.object(mainCoin.coinObjectId);
                if (otherCoins.length > 0) {
                    tx.mergeCoins(mainCoinObject, otherCoins.map(c => tx.object(c.coinObjectId)));
                }
                const [paymentCoin] = tx.splitCoins(mainCoinObject, [tx.pure.u64(priceInMist.toString())]);
                
                const functionName = listing.asset.isFraction ? 'rent_fraction_tkt' : 'rent_nft_tkt';
                tx.moveCall({
                    target: `${suiConfig.rentalPackageId}::rental_market::${functionName}`,
                    arguments: [
                        tx.object(listing.listingId),
                        tx.object(suiConfig.vipRegistryId),
                        tx.object(suiConfig.daoTreasuryId),
                        tx.object(suiConfig.tktTreasuryCapId),
                        paymentCoin
                    ],
                });

            } else {
                // --- LÓGICA COMPLETA PARA SUI ---
                const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist.toString())]);
                const functionName = listing.asset.isFraction ? 'rent_fraction' : 'rent_nft';

                tx.moveCall({
                    target: `${suiConfig.rentalPackageId}::rental_market::${functionName}`,
                    arguments: [
                        tx.object(listing.listingId),
                        tx.object(suiConfig.vipRegistryId),
                        tx.object(suiConfig.stakingPoolId),
                        paymentCoin
                    ],
                });
            }
            
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: '✅ Rental Successful!', description: 'You have received a Rental Receipt. Check your dashboard.' });

        } catch(e: any) {
            toast({ variant: 'destructive', title: '❌ Rental Failed', description: e.message });
        }
    };

    return (
        <Card className="glass-card flex flex-col">
            <CardHeader className="p-0">
                <img src={listing.asset.imageUrl} alt={listing.asset.name} className="w-full h-48 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="line-clamp-2">{listing.asset.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2 text-sm">
                    <Calendar className="w-4 h-4" /> {startDate} - {endDate}
                </CardDescription>
            </CardContent>
            <CardContent className="p-4 border-t flex justify-between items-center">
                <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-xl font-bold text-primary">{price.toLocaleString()} {currency}</p>
                </div>
                <Button onClick={handleRent} disabled={isPending || !account || listing.isRented || account.address === listing.owner}>
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Key className="w-4 h-4"/>}
                    <span className="ml-2">{listing.isRented ? 'Rented' : 'Rent Now'}</span>
                </Button>
            </CardContent>
        </Card>
    );
}
