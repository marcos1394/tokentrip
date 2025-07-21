'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { suiConfig } from "@/config/sui";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { ActiveLoan } from "@/hooks/useGetActiveLoans";

interface ActiveLoanCardProps {
    loan: ActiveLoan;
    role: 'borrower' | 'lender';
    onActionSuccess: () => void;
}

export function ActiveLoanCard({ loan, role, onActionSuccess }: ActiveLoanCardProps) {
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
    const { toast } = useToast();
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const isOverdue = Date.now() > loan.dueDate;

    const handleRepay = async () => {
        if (!account) return;
        try {
            const tx = new Transaction();
            const repaymentInMist = BigInt(Math.floor(loan.repayment * 1e9));

            if (loan.currency === 'TKT') {
                const tktCoinType = `${suiConfig.tktPackageId}::tkt::TKT`;
                const { data: tktCoins } = await suiClient.getCoins({ owner: account.address, coinType: tktCoinType });
                if (!tktCoins || tktCoins.length === 0) throw new Error("You have no TKT coins.");
                
                const mainCoin = tx.object(tktCoins[0].coinObjectId);
                if (tktCoins.length > 1) tx.mergeCoins(mainCoin, tktCoins.slice(1).map(c => tx.object(c.coinObjectId)));
                
                const [paymentCoin] = tx.splitCoins(mainCoin, [tx.pure.u64(repaymentInMist.toString())]);

                tx.moveCall({
                    target: `${suiConfig.lendingPackageId}::lending_market::repay_loan_tkt`,
                    arguments: [ tx.object(loan.loanId), tx.object(suiConfig.vipRegistryId), tx.object(suiConfig.daoTreasuryId), tx.object(suiConfig.tktTreasuryCapId), paymentCoin, tx.object("0x6") ],
                });
            } else {
                const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(repaymentInMist.toString())]);
                tx.moveCall({
                    target: `${suiConfig.lendingPackageId}::lending_market::repay_loan_sui`,
                    arguments: [ tx.object(loan.loanId), tx.object(suiConfig.vipRegistryId), tx.object(suiConfig.stakingPoolId), paymentCoin, tx.object("0x6") ],
                });
            }
            
            await signAndExecute({ transaction: tx });
            toast({ title: '✅ Loan Repaid!', description: 'The collateral NFT has been returned to your wallet.' });
            onActionSuccess();

        } catch (e: any) {
            toast({ variant: 'destructive', title: `❌ Repayment failed`, description: e.message });
        }
    };
    
    const handleLiquidate = () => {
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.lendingPackageId}::lending_market::liquidate_loan`,
            arguments: [tx.object(loan.loanId), tx.object("0x6")],
        });
        
        signAndExecute({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ Loan Liquidated!', description: 'The collateral NFT has been transferred to your wallet.' });
                onActionSuccess();
            },
            onError: (e) => toast({ variant: 'destructive', title: `❌ Liquidation failed`, description: e.message }),
        });
    };
    
    return (
        <Card className="glass-card">
            <CardHeader className="p-0"><img src={loan.nft.imageUrl} alt={loan.nft.name} className="w-full h-40 object-cover rounded-t-lg" /></CardHeader>
            <CardContent className="p-4">
                <CardTitle className="truncate text-md">{loan.nft.name}</CardTitle>
                <CardDescription>Due: {new Date(loan.dueDate).toLocaleDateString()}</CardDescription>
                {role === 'borrower' && <CardDescription className="text-xs mt-1">Lender: <span className="font-mono">{loan.lender}</span></CardDescription>}
                {role === 'lender' && <CardDescription className="text-xs mt-1">Borrower: <span className="font-mono">{loan.borrower}</span></CardDescription>}
            </CardContent>
            <CardFooter className="p-4">
                {role === 'borrower' && !isOverdue && <Button className="w-full btn-sui" onClick={handleRepay} disabled={isPending}><ShieldCheck className="w-4 h-4 mr-2"/>Repay {loan.repayment.toLocaleString()} {loan.currency}</Button>}
                {role === 'lender' && isOverdue && <Button variant="destructive" className="w-full" onClick={handleLiquidate} disabled={isPending}><ShieldX className="w-4 h-4 mr-2"/>Liquidate</Button>}
                {role === 'borrower' && isOverdue && <p className="text-xs text-center text-destructive">This loan is overdue and can be liquidated by the lender.</p>}
                {role === 'lender' && !isOverdue && <p className="text-xs text-center text-muted-foreground">Waiting for borrower to repay.</p>}
            </CardFooter>
        </Card>
    );
}
