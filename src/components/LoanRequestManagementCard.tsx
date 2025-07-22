'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { suiConfig } from "@/config/sui";
import { useToast } from "@/hooks/use-toast";
import { LoanRequest } from "@/hooks/useGetLoanRequests";
import { Ban, Loader2 } from "lucide-react";

interface LoanRequestManagementCardProps {
    request: LoanRequest;
    onActionSuccess: () => void;
}

export function LoanRequestManagementCard({ request, onActionSuccess }: LoanRequestManagementCardProps) {
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
    const { toast } = useToast();

    const handleCancelRequest = () => {
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.lendingPackageId}::lending_market::delist_loan_request`,
            arguments: [tx.object(request.requestId)],
        });
        
        signAndExecute({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: `✅ Success!`, description: `Loan request has been cancelled.` });
                onActionSuccess();
            },
            onError: (e) => toast({ variant: 'destructive', title: `❌ Cancellation failed`, description: e.message }),
        });
    };

    return (
        <Card className="glass-card">
            <CardHeader className="p-0">
                <img src={request.nft.imageUrl} alt={request.nft.name} className="w-full h-40 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4">
                <CardTitle className="truncate text-md">{request.nft.name}</CardTitle>
                <CardDescription>Requesting {request.principal} {request.currency}</CardDescription>
            </CardContent>
            <CardFooter className="p-4">
                <Button variant="destructive" className="w-full" onClick={handleCancelRequest} disabled={isPending}>
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2"/>}
                    Cancel Request
                </Button>
            </CardFooter>
        </Card>
    );
}
