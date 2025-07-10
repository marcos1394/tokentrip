// app/[locale]/staking/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from 'lucide-react';
import { StakingHeader } from '@/components/staking/StakingHeader';
import { PoolStatsCard } from '@/components/staking/PoolStatsCard';
import { WalletBalanceCard } from '@/components/staking/WalletBalancedCard';
import { StakeFormCard } from '@/components/staking/StakeFormCard';
import { UserReceiptsCard } from '@/components/staking/UserReceiptsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// --- Interfaces Completas ---
interface StakingPoolFields { 
    id: { id: string }; 
    total_staked: string;
    // ... otros campos como rewards_per_second, etc.
}
interface StakeReceipt { 
    id: { id: string };
    objectId: string; 
    amount_staked: string;
    // ... otros campos como last_claim_timestamp, etc.
}

const APY = 8.5; // APY de ejemplo

export default function StakingPage() {
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    const [stakeAmount, setStakeAmount] = useState('');
    const queryClient = useQueryClient();
    const suiClient = useSuiClient();

    const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
    
    // --- Lógica de Datos ---
    const { data: tktBalanceData, isLoading: isLoadingBalance, refetch: refetchTktBalance } = useSuiClientQuery('getBalance', { owner: currentAccount?.address!, coinType: TKT_COIN_TYPE }, { enabled: !!currentAccount });
    const { data: poolData, isLoading: isLoadingPool, refetch: refetchPoolData } = useSuiClientQuery('getObject', { id: suiConfig.stakingPoolId, options: { showContent: true } }, { queryKey: ['staking-pool'] });
    const { data: receiptsData, isLoading: isLoadingReceipts, refetch: refetchReceipts } = useSuiClientQuery('getOwnedObjects', { owner: currentAccount?.address!, filter: { StructType: `${suiConfig.packageId}::staking::StakeReceipt` }, options: { showContent: true } }, { enabled: !!currentAccount });
 
    const { mutateAsync: executeTx, isPending } = useSignAndExecuteTransaction();

    // --- Lógica de Transacciones Corregida y Completa ---
    const invalidateAllQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['staking-pool'] });
        queryClient.invalidateQueries({ queryKey: ['stake-receipts', currentAccount?.address] });
        refetchTktBalance(); // Usamos el refetch específico para el balance
    };

    const handleStake = async () => {
        if (!currentAccount?.address) return toast({ variant: "destructive", title: "Wallet not connected" });
        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount <= 0) return toast({ variant: "destructive", title: "Invalid Amount" });

        const tx = new Transaction();
        const amountInMist = BigInt(amount * (10 ** 9));
        
        const { data: userTktCoins } = await suiClient.getCoins({ owner: currentAccount.address, coinType: TKT_COIN_TYPE });
        const totalBalance = userTktCoins.reduce((acc, coin) => acc + BigInt(coin.balance), 0n);

        if (totalBalance < amountInMist) {
            return toast({ variant: "destructive", title: "Insufficient TKT balance" });
        }

        const [mainCoin, ...otherCoins] = userTktCoins;
        const mainCoinObject = tx.object(mainCoin.coinObjectId);
        if (otherCoins.length > 0) {
            tx.mergeCoins(mainCoinObject, otherCoins.map(c => tx.object(c.coinObjectId)));
        }
        
        const [coinToStake] = tx.splitCoins(mainCoinObject, [tx.pure.u64(amountInMist)]);
        
        tx.moveCall({
            target: `${suiConfig.packageId}::staking::stake`,
            arguments: [ tx.object(suiConfig.stakingPoolId), coinToStake ],
            typeArguments: [TKT_COIN_TYPE],
        });

        try {
            await executeTx({ transaction: tx });
            toast({ title: "✅ Stake Successful", description: `You have staked ${amount} TKT.` });
            setStakeAmount('');
            invalidateAllQueries();
        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Stake Failed", description: error.message });
        }
    };

    const handleClaimOrUnstake = async (receiptId: string, action: 'claim' | 'unstake') => {
        const tx = new Transaction();
        const functionName = action === 'claim' ? 'claim_rewards' : 'unstake';
        
        tx.moveCall({
            target: `${suiConfig.packageId}::staking::${functionName}`,
            arguments: [ tx.object(suiConfig.stakingPoolId), tx.object(receiptId) ],
            typeArguments: [TKT_COIN_TYPE],
        });

        try {
            await executeTx({ transaction: tx });
            toast({ title: `✅ ${action === 'claim' ? 'Rewards Claimed' : 'Unstake Successful'}!` });
            invalidateAllQueries();
        } catch (error: any) {
            toast({ variant: "destructive", title: `❌ ${action === 'claim' ? 'Claim Failed' : 'Unstake Failed'}`, description: error.message });
        }
    };
    
    // --- Cálculos de UI con BigInt ---
    const userTktBalance = useMemo(() => tktBalanceData ? BigInt(tktBalanceData.totalBalance) : 0n, [tktBalanceData]);
    const stakeAmountBigInt = useMemo(() => stakeAmount ? BigInt(parseFloat(stakeAmount) * (10 ** 9)) : 0n, [stakeAmount]);
    const balanceAfterStake = useMemo(() => (userTktBalance - stakeAmountBigInt) >= 0n ? (userTktBalance - stakeAmountBigInt) : 0n, [userTktBalance, stakeAmountBigInt]);
    const estimatedReturns = useMemo(() => (Number(stakeAmountBigInt) / 1e9) * APY, [stakeAmountBigInt]);
    
    const poolFields = poolData?.data?.content?.dataType === 'moveObject' ? poolData.data.content.fields as unknown as StakingPoolFields : null;
    const totalStakedInTkt = poolFields ? BigInt(poolFields.total_staked) : 0n;
    
    const userReceipts: StakeReceipt[] = useMemo(() => 
        receiptsData?.data
            ?.map(receipt => {
                if (receipt.data?.content?.dataType !== 'moveObject') return null;
                const fields = receipt.data.content.fields as unknown as StakeReceipt;
                return { ...fields, objectId: receipt.data.objectId };
            })
            .filter((receipt): receipt is StakeReceipt => receipt !== null) ?? [],
        [receiptsData]
    );

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
                <StakingHeader />
                <div className="grid lg:grid-cols-3 gap-8 mt-12">
                    <div className="lg:col-span-1 space-y-8">
                        <PoolStatsCard totalStaked={Number(totalStakedInTkt) / 1e9} apy={APY} isLoading={isLoadingPool} tokenSymbol="TKT" />
                        <WalletBalanceCard balance={Number(userTktBalance) / 1e9} isLoading={isLoadingBalance} tokenSymbol="TKT" />
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                        <Tabs defaultValue="stake" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="stake">Stake TKT</TabsTrigger>
                                <TabsTrigger value="manage">Manage Stakes</TabsTrigger>
                            </TabsList>
                            <TabsContent value="stake" className="mt-6">
                                <StakeFormCard 
                                    stakeAmount={stakeAmount}
                                    setStakeAmount={setStakeAmount}
                                    handleStake={handleStake}
                                    isStakePending={isPending}
                                    isWalletConnected={!!currentAccount}
                                    userTktBalance={Number(userTktBalance) / 1e9}
                                    balanceAfterStake={Number(balanceAfterStake) / 1e9}
                                    estimatedReturns={estimatedReturns}
                                    tokenSymbol="TKT"
                                />
                            </TabsContent>
                            <TabsContent value="manage" className="mt-6">
                                <UserReceiptsCard 
                                    receipts={userReceipts}
                                    isLoading={isLoadingReceipts}
                                    onClaim={(receiptId) => handleClaimOrUnstake(receiptId, 'claim')}
                                    onUnstake={(receiptId) => handleClaimOrUnstake(receiptId, 'unstake')}
                                    isActionPending={isPending}
                                    tokenSymbol="TKT"
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}