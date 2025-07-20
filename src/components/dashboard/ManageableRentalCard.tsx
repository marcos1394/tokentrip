'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { suiConfig } from "@/config/sui";
import { useToast } from "@/hooks/use-toast";
import { Clock, Ban, Download } from "lucide-react";

export function ManageableRentalCard({ listing }: { listing: any }) {
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
    const { toast } = useToast();
    const fields = listing.content.fields;
    const asset = fields.is_fraction ? fields.fraction.fields.some.fields : fields.experience_nft.fields.some.fields;
    const imageUrl = asset.parent_image_url?.fields?.url || asset.image_url?.fields?.url;

    const canReclaim = Date.now() >= Number(fields.end_timestamp_ms);

    const handleAction = (action: 'delist' | 'reclaim') => {
        const tx = new Transaction();
        const functionName = action === 'delist'
            ? (fields.is_fraction ? 'delist_fraction' : 'delist_nft')
            : (fields.is_fraction ? 'reclaim_fraction' : 'reclaim_nft');

        tx.moveCall({
            target: `${suiConfig.rentalPackageId}::rental_market::${functionName}`,
            arguments: [tx.object(listing.objectId), tx.object("0x6")],
        });
        
        signAndExecute({ transaction: tx }, {
            onSuccess: () => toast({ title: `✅ Success!`, description: `Rental listing has been ${action}ed.` }),
            onError: (e) => toast({ variant: 'destructive', title: `❌ ${action} failed`, description: e.message }),
        });
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <img src={imageUrl} alt={asset.name || asset.parent_name} className="w-full h-40 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent>
                <CardTitle className="truncate">{asset.name || asset.parent_name}</CardTitle>
                <CardDescription>Status: {fields.is_rented ? 'Rented' : 'Listed'}</CardDescription>
            </CardContent>
            <CardFooter className="flex gap-2">
                {!fields.is_rented && <Button variant="outline" size="sm" onClick={() => handleAction('delist')} disabled={isPending}><Ban className="w-4 h-4 mr-2"/>Delist</Button>}
                {canReclaim && <Button variant="outline" size="sm" onClick={() => handleAction('reclaim')} disabled={isPending}><Download className="w-4 h-4 mr-2"/>Reclaim</Button>}
            </CardFooter>
        </Card>
    );
}
