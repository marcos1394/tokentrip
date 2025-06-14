'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SuiObjectResponse } from '@mysten/sui/client';


// Componentes de UI y de página
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from 'lucide-react';
import { StakingHeader } from '@/components/staking/StakingHeader';
import { PoolStatsCard } from '@/components/staking/PoolStatsCard';
import { WalletBalanceCard } from '@/components/staking/WalletBalanceCard';
import { StakeFormCard } from '@/components/staking/StakeFormCard';
import { UserReceiptsCard } from '@/components/staking/UserReceiptsCard';

// Interfaces
interface StakingPoolFields { 
    id: { id: string }; 
    total_staked: string; 
}
interface StakeReceiptFields { 
    id: { id: string }; 
    amount_staked: string; 
}

const APY = 0.08; // 8%

export default function StakingPage() {
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    const [stakeAmount, setStakeAmount] = useState('');
    const params = useParams();
    const locale = params.locale as string;
    const queryClient = useQueryClient();
    const suiClient = useSuiClient();

    // --- LÓGICA DE DATOS Y TRANSACCIONES ---
    const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
    
    // Query para el balance de TKT del usuario
    const { data: tktBalanceData, isLoading: isLoadingBalance } = useSuiClientQuery(
        'getBalance',
        {
            owner: currentAccount?.address!,
            coinType: TKT_COIN_TYPE,
        },
        { 
            enabled: !!currentAccount, 
            queryKey: ['tkt-balance', currentAccount?.address] 
        }
    );
    
    // Query para el Staking Pool
    const { data: poolData, isLoading: isLoadingPool } = useSuiClientQuery(
        'getObject', 
        { id: suiConfig.stakingPoolId, options: { showContent: true } }, 
        { queryKey: ['staking-pool'] }
    );
    
    // Query para los recibos de staking del usuario
    const { data: receiptsData, isLoading: isLoadingReceipts } = useSuiClientQuery(
        'getOwnedObjects',
        { 
            owner: currentAccount?.address!, 
            filter: { StructType: `${suiConfig.packageId}::experience_nft::StakeReceipt` }, 
            options: { showContent: true }
        },
        { enabled: !!currentAccount, queryKey: ['stake-receipts', currentAccount?.address] }
    );
  
    const { mutate: executeStake, isPending: isStakePending } = useSignAndExecuteTransaction();
    const { mutate: executeClaim, isPending: isClaimPending } = useSignAndExecuteTransaction();

    const handleStake = async () => {
        if (!currentAccount?.address) {
            toast({ variant: "destructive", title: "Billetera no conectada" });
            return;
        }
        const amount = parseFloat(stakeAmount);
        if (!amount || amount <= 0) {
            toast({ variant: "destructive", title: "Monto inválido" });
            return;
        }

        const tx = new Transaction();
        const amountInMist = BigInt(amount * (10 ** 9));

        const { data: userTktCoins } = await suiClient.getCoins({
            owner: currentAccount.address,
            coinType: TKT_COIN_TYPE,
        });

        if (userTktCoins.length === 0) {
            toast({ variant: "destructive", title: "No tienes TKT para hacer stake." });
            return;
        }

        const [mainCoin, ...otherCoins] = userTktCoins;
        const mainCoinObject = tx.object(mainCoin.coinObjectId);
        if (otherCoins.length > 0) {
            tx.mergeCoins(mainCoinObject, otherCoins.map(c => c.coinObjectId));
        }
        
        const [coinToStake] = tx.splitCoins(mainCoinObject, [tx.pure.u64(amountInMist)]);
        
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::stake`,
            arguments: [ tx.object(suiConfig.stakingPoolId), coinToStake ],
            typeArguments: [TKT_COIN_TYPE],
        });

        executeStake({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: "✅ Stake exitoso", description: `Has depositado ${amount} TKT.` });
                setStakeAmount('');
                queryClient.invalidateQueries({ queryKey: ['staking-pool'] });
                queryClient.invalidateQueries({ queryKey: ['stake-receipts', currentAccount?.address] });
                queryClient.invalidateQueries({ queryKey: ['tkt-balance', currentAccount?.address] });
            },
            onError: (error) => {
                toast({ variant: "destructive", title: "❌ Error en el Stake", description: error.message });
            }
        });
    };

    const handleClaim = (receiptId: string) => {
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::claim_rewards`,
            arguments: [ tx.object(suiConfig.stakingPoolId), tx.object(receiptId) ],
        });
        executeClaim({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: "✅ ¡Recompensa Reclamada!", description: "Los SUI han sido añadidos a tu billetera."});
                queryClient.invalidateQueries({ queryKey: ['staking-pool'] });
                queryClient.invalidateQueries({ queryKey: ['stake-receipts', currentAccount?.address] });
                // También invalidamos el balance de SUI, que es un query diferente.
                queryClient.invalidateQueries({ queryKey: ['get-balance', currentAccount?.address, '0x2::sui::SUI'] }); 
            },
            onError: (error) => {
                toast({ variant: "destructive", title: "❌ Error al Reclamar", description: error.message });
            }
        });
    };

    const userTktBalance = useMemo(() => tktBalanceData ? Number(tktBalanceData.totalBalance) / (10 ** 9) : 0, [tktBalanceData]);
    const stakeAmountNumber = useMemo(() => parseFloat(stakeAmount) || 0, [stakeAmount]);
    const balanceAfterStake = useMemo(() => userTktBalance - stakeAmountNumber, [userTktBalance, stakeAmountNumber]);
    const estimatedReturns = useMemo(() => stakeAmountNumber * APY, [stakeAmountNumber]);
    const poolFields = poolData?.data?.content?.dataType === 'moveObject' ? poolData.data.content.fields as unknown as StakingPoolFields : null;
    const totalStakedInTkt = poolFields ? Number(poolFields.total_staked) / (10 ** 9) : 0;
    
    const userReceipts = receiptsData?.data
        ?.map(receipt => receipt.data?.content?.dataType === 'moveObject' ? receipt.data.content.fields as unknown as StakeReceiptFields : null)
        .filter((receipt): receipt is StakeReceiptFields => receipt !== null) ?? [];

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href={`/${locale}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al Inicio
                        </Link>
                    </Button>
                </div>
                <StakingHeader />
                <div className="grid lg:grid-cols-3 gap-8 mt-12">
                    <div className="lg:col-span-1 space-y-8">
                        <PoolStatsCard totalStaked={totalStakedInTkt} apy={APY} isLoading={isLoadingPool} tokenSymbol="TKT" />
                        <WalletBalanceCard balance={userTktBalance} isLoading={isLoadingBalance} tokenSymbol="TKT" />
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                        <StakeFormCard 
                            stakeAmount={stakeAmount}
                            setStakeAmount={setStakeAmount}
                            handleStake={handleStake}
                            isStakePending={isStakePending}
                            isWalletConnected={!!currentAccount}
                            userSuiBalance={userTktBalance}
                            balanceAfterStake={balanceAfterStake}
                            estimatedReturns={estimatedReturns}
                            tokenSymbol="TKT"
                        />
                        <UserReceiptsCard 
                            receipts={userReceipts}
                            isLoading={isLoadingReceipts}
                            onClaim={handleClaim}
                            isClaimPending={isClaimPending}
                            tokenSymbol="TKT"
                        />
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}