'use client';

import { useMemo, useState } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import { useToast } from "@/hooks/use-toast";
import { LoanRequest } from '@/hooks/useGetLoanRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Handshake, TrendingUp, CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LoanRequestCard({ request }: { request: LoanRequest }) {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { toast } = useToast();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const lenderProfit = useMemo(() => request.repayment - request.principal, [request]);
    const isBorrower = account?.address === request.borrower;

    const handleFundLoan = async () => {
        if (!account) return;

        try {
            const tx = new Transaction();
            const currencyType = request.currency === 'TKT' 
                ? `${suiConfig.tktPackageId}::tkt::TKT`
                : '0x2::sui::SUI';
            
            const functionName = request.currency === 'TKT' ? 'fund_loan_tkt' : 'fund_loan_sui';
            const principalInMist = BigInt(Math.floor(request.principal * 1e9));

            let paymentCoin;

            if (request.currency === 'TKT') {
                const { data: tktCoins } = await suiClient.getCoins({ owner: account.address, coinType: currencyType });
                if (!tktCoins || tktCoins.data.length === 0) throw new Error("You have no TKT coins.");
                const [mainCoin, ...otherCoins] = tktCoins.data;
                const mainCoinObject = tx.object(mainCoin.coinObjectId);
                if (otherCoins.length > 0) tx.mergeCoins(mainCoinObject, otherCoins.map(c => tx.object(c.coinObjectId)));
                [paymentCoin] = tx.splitCoins(mainCoinObject, [tx.pure.u64(principalInMist.toString())]);
            } else {
                [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(principalInMist.toString())]);
            }
            
            tx.moveCall({
                target: `${suiConfig.lendingPackageId}::lending_market::${functionName}`,
                arguments: [
                    tx.object(request.requestId),
                    paymentCoin,
                    tx.object("0x6") // Clock
                ],
            });

            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: '✅ Loan Funded!', description: 'You are now the lender for this experience.' });

        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Funding Failed', description: error.message });
        }
    };

    return (
        <Card className="glass-card flex flex-col">
            <CardHeader className="p-0">
                <img src={request.nft.imageUrl} alt={request.nft.name} className="w-full h-48 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="line-clamp-2 text-md">{request.nft.name}</CardTitle>
                <CardDescription className="text-xs mt-1">
                    by <span className="font-mono truncate">{request.borrower}</span>
                </CardDescription>
            </CardContent>
            <CardContent className="p-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requesting</span>
                    <span className="font-semibold">{request.principal.toLocaleString()} {request.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Repays</span>
                    <span className="font-semibold">{request.repayment.toLocaleString()} {request.currency}</span>
                </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-semibold">{request.durationDays} days</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-green-500">
                    <span className="flex items-center gap-1">
                        Lender Profit
                        <TooltipProvider>
                            <Tooltip><TooltipTrigger><CircleHelp className="w-3 h-3"/></TooltipTrigger><TooltipContent><p>The profit you earn as a lender.</p></TooltipContent></Tooltip>
                        </TooltipProvider>
                    </span>
                    <span>{lenderProfit.toLocaleString()} {request.currency}</span>
                </div>
            </CardContent>
            <CardFooter className="p-4">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button className="w-full btn-sui" disabled={!account || isBorrower}>
                            <Handshake className="w-4 h-4 mr-2" />
                            {isBorrower ? "Your Own Request" : "Fund Loan"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Loan Funding</DialogTitle>
                            <DialogDescription>
                                You are about to lend {request.principal.toLocaleString()} {request.currency} to receive {request.repayment.toLocaleString()} {request.currency} back in {request.durationDays} days. The NFT "{request.nft.name}" will be held as collateral.
                            </DialogDescription>
                        </DialogHeader>
                        <Button className="w-full btn-sui" onClick={handleFundLoan} disabled={isPending}>
                            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Confirm and Lend
                        </Button>
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    );
}
