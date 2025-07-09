'use client';

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Lock, Gem, UserCheck } from 'lucide-react';

// --- Interfaces para los datos que esperamos del contrato ---

// Suponemos que hay un objeto StakingPool con estos campos
interface StakingPoolFields {
    total_staked_tkt: string; // Balance total de TKT en staking
    rewards_per_second: string; // Tasa de recompensas para calcular el APY
}

// Suponemos que cada staker tiene un objeto StakedPosition
interface StakedPositionFields {
    staked_amount: string; // Cantidad de TKT que el usuario ha puesto en stake
    // otros campos como `last_claim_timestamp`, etc.
}

export function StakingHeader() {
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();

    // === CONSULTA 1: DATOS GLOBALES DEL POOL DE STAKING ===
    const { data: poolData, isLoading: isLoadingPool } = useQuery({
        queryKey: ['staking-pool-data', suiConfig.stakingPoolId],
        queryFn: async () => {
            if (!suiConfig.stakingPoolId) return null;

            const response = await suiClient.getObject({
                id: suiConfig.stakingPoolId,
                options: { showContent: true }
            });

            return response.data?.content?.dataType === 'moveObject'
    ? response.data.content.fields as unknown as StakingPoolFields // <-- CORRECCIÓN AQUÍ
    : null;
        },
        // Se re-consulta cada 5 minutos para mantener los datos frescos
        refetchInterval: 300000, 
    });

    // === CONSULTA 2: DATOS PERSONALES DE STAKING DEL USUARIO ===
    const { data: userStakeData, isLoading: isLoadingUserStake } = useQuery({
        queryKey: ['user-staked-position', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address || !suiConfig.packageId) return null;

            // Buscamos el objeto StakedPosition que le pertenece al usuario actual
            const response = await suiClient.getOwnedObjects({
                owner: currentAccount.address,
                filter: { StructType: `${suiConfig.packageId}::staking::StakedPosition` },
                options: { showContent: true },
                limit: 1, // Un usuario solo debería tener una posición
            });
            
            if (response.data.length === 0) return null;

           // Dentro de la queryFn de 'user-staked-position'

return response.data[0].data?.content?.dataType === 'moveObject'
    ? response.data[0].data.content.fields as unknown as StakedPositionFields // <-- CORRECIÓN AQUÍ
    : null;
        },
        enabled: !!currentAccount,
    });
    
    // --- Cálculos de las métricas a mostrar ---
    const totalStaked = poolData ? Number(BigInt(poolData.total_staked_tkt) / BigInt(10**9)) : 0;
    const userStaked = userStakeData ? Number(BigInt(userStakeData.staked_amount) / BigInt(10**9)) : 0;
    
    // Un cálculo de APY de ejemplo. En un caso real, esto dependería
    // del precio del token TKT y el token de recompensa.
    const APY = 23.5; 

    return (
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground text-balance">
                Gobernanza y Staking
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                {/* Métrica 1: Total Staked */}
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de TKT en Staking</CardTitle>
                        <Lock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingPool ? (
                            <Skeleton className="h-8 w-3/4" />
                        ) : (
                            <div className="text-3xl font-bold text-foreground">
                                {totalStaked.toLocaleString('es-MX')}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Tokens bloqueados por la comunidad</p>
                    </CardContent>
                </Card>

                {/* Métrica 2: APY */}
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">APY Actual</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingPool ? (
                             <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="text-3xl font-bold text-green-500">
                                {APY.toFixed(1)}%
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Rendimiento anual estimado</p>
                    </CardContent>
                </Card>

                {/* Métrica 3: Símbolo del Token */}
                 <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Token de Gobernanza</CardTitle>
                        <Gem className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            TKT
                        </div>
                        <p className="text-xs text-muted-foreground">El token que impulsa el ecosistema</p>
                    </CardContent>
                </Card>

                {/* Métrica 4: Tu Staking Personal */}
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tu Staking (TKT)</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingUserStake ? (
                             <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="text-3xl font-bold text-primary">
                                {currentAccount ? userStaked.toLocaleString('es-MX') : '---'}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Tu participación en la gobernanza</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}