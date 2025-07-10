'use client';

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Lock, DollarSign, UserCheck, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from 'react';

// --- Interfaces Completas para los Datos del Contrato ---

interface StakingPoolFields {
    id: { id: string };
    total_staked_tkt: string;   // Balance total de TKT en staking
    rewards_per_second: string; // Tasa de recompensas para calcular el APY
    reward_token_type: string;  // Tipo del token de recompensa (ej. '0x2::sui::SUI')
    total_rewards: string;      // Cantidad total de tokens de recompensa en el pool
}

interface StakedPositionFields {
    id: { id: string };
    staked_amount: string;         // Cantidad de TKT que el usuario ha puesto en stake
    reward_earned: string;         // Recompensas que el usuario ha ganado
    last_claim_timestamp_ms: string; // Última vez que el usuario reclamó
}

export function StakingHeader() {
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();

    // === CONSULTA 1: DATOS GLOBALES DEL POOL DE STAKING ===
    const { data: poolData, isLoading: isLoadingPool } = useQuery({
        queryKey: ['staking-pool-data', suiConfig.stakingPoolId],
        queryFn: async () => {
            if (!suiConfig.stakingPoolId || suiConfig.stakingPoolId.includes('PLACEHOLDER')) return null;
            const response = await suiClient.getObject({
                id: suiConfig.stakingPoolId,
                options: { showContent: true }
            });
            return response.data?.content?.dataType === 'moveObject'
                ? response.data.content.fields as unknown as StakingPoolFields
                : null;
        },
        refetchInterval: 300000,
    });

    // === CONSULTA 2: DATOS PERSONALES DE STAKING DEL USUARIO ===
    const { data: userStakeData, isLoading: isLoadingUserStake } = useQuery({
        queryKey: ['user-staked-position', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address || !suiConfig.packageId || suiConfig.packageId.includes('PLACEHOLDER')) return null;
            const response = await suiClient.getOwnedObjects({
                owner: currentAccount.address,
                filter: { StructType: `${suiConfig.packageId}::staking::StakedPosition` },
                options: { showContent: true },
                limit: 1,
            });
            if (response.data.length === 0) return null;
            return response.data[0].data?.content?.dataType === 'moveObject'
                ? response.data[0].data.content.fields as unknown as StakedPositionFields
                : null;
        },
        enabled: !!currentAccount,
    });
    
    // --- Cálculos de las métricas a mostrar usando useMemo para eficiencia ---
    const { totalStaked, userStaked, tvl, apy } = useMemo(() => {
        // Precios de ejemplo para los cálculos
        const TKT_PRICE_USD = 0.05;
        const SUI_PRICE_USD = 1.05;

        const totalStakedBigInt = BigInt(poolData?.total_staked_tkt ?? '0');
        const totalStaked = Number(totalStakedBigInt / BigInt(10**9));
        
        const userStakedBigInt = BigInt(userStakeData?.staked_amount ?? '0');
        const userStaked = Number(userStakedBigInt / BigInt(10**9));

        const tvl = totalStaked * TKT_PRICE_USD;
        
        let apy = 0;
        if (poolData && totalStakedBigInt > 0n) {
            const rewardsPerSecond = BigInt(poolData.rewards_per_second);
            const secondsInYear = BigInt(31536000);
            const rewardsPerYearInSui = rewardsPerSecond * secondsInYear;
            
            // Valor de las recompensas anuales en USD
            const rewardsValuePerYear = (Number(rewardsPerYearInSui) / 1e9) * SUI_PRICE_USD;
            // Valor total en stake en USD
            const stakedValue = (Number(totalStakedBigInt) / 1e9) * TKT_PRICE_USD;
            
            if (stakedValue > 0) {
                apy = (rewardsValuePerYear / stakedValue) * 100;
            }
        }

        return { totalStaked, userStaked, tvl, apy };
    }, [poolData, userStakeData]);

    return (
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground text-balance">
                Governance & Staking
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total TKT Staked</CardTitle>
                        <Lock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingPool ? (
                            <Skeleton className="h-8 w-3/4" />
                        ) : (
                            <div className="text-3xl font-bold text-foreground">
                                {totalStaked.toLocaleString('en-US')}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Tokens locked by the community</p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current APY</CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Estimated APY based on current rewards and TVL.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPool ? (
                             <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="text-3xl font-bold text-green-500">
                                {apy.toFixed(1)}%
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Estimated annual percentage yield</p>
                    </CardContent>
                </Card>

                 <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Value Locked (TVL)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       {isLoadingPool ? (
                            <Skeleton className="h-8 w-3/4" />
                        ) : (
                            <div className="text-3xl font-bold text-foreground">
                                ${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Total value of assets in the pool</p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Your Stake (TKT)</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingUserStake ? (
                             <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="text-3xl font-bold text-primary">
                                {currentAccount ? userStaked.toLocaleString('en-US') : '---'}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Your contribution to governance</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}