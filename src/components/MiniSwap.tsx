'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { initCetusSDK, Percentage, adjustForSlippage } from '@cetusprotocol/cetus-sui-clmm-sdk';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowDown } from 'lucide-react';
import { SuiClient } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';

const SUI_COIN_TYPE = '0x2::sui::SUI';
const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
const SUI_DECIMALS = 9;
const WAL_DECIMALS = 9;

interface MiniSwapProps {
    fromCoinType: string;
    toCoinType: string;
    onSwapSuccess: () => void;
}

export function MiniSwap({ fromCoinType, toCoinType, onSwapSuccess }: MiniSwapProps) {
    const account = useCurrentAccount();
    const { toast } = useToast();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const [fromAmount, setFromAmount] = useState('0.1');
    const [toAmount, setToAmount] = useState('');
    const [isFetchingQuote, setIsFetchingQuote] = useState(false);
    const [preswapResult, setPreswapResult] = useState<any>(null);
    const [userBalance, setUserBalance] = useState<string | null>(null);
    const [poolData, setPoolData] = useState<any>(null);

    // Función para obtener el balance del usuario
    const getUserBalance = useCallback(async () => {
        if (!account) return;
        
        try {
            console.log('🔄 Obteniendo balance del usuario:', account.address);
            const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
            
            const balanceResponse = await client.getBalance({
                owner: account.address,
                coinType: '0x2::sui::SUI',
            });
            
            console.log('💰 Balance obtenido:', balanceResponse);
            setUserBalance(balanceResponse.totalBalance);
            
        } catch (error) {
            console.error('❌ Error obteniendo balance:', error);
            setUserBalance(null);
        }
    }, [account]);

    useEffect(() => {
        if (account) {
            getUserBalance();
        }
    }, [account, getUserBalance]);

    const getQuote = useCallback(async () => {
        if (parseFloat(fromAmount) > 0 && account) {
            console.log('🔄 Obteniendo cotización para:', fromAmount, 'SUI');
            setIsFetchingQuote(true);
            setPreswapResult(null);
            setPoolData(null);
            
            try {
                // Inicializar SDK para obtener pools
                console.log('🔧 Inicializando Cetus SDK para obtener pools...');
                const sdk = initCetusSDK({ network: 'testnet' });
                
                // Obtener pools y encontrar el correcto - COMO EN EL SCRIPT QUE FUNCIONA
                console.log('🔍 Buscando pool SUI/WAL...');
                const allPools = await sdk.Pool.getPoolsWithPage([]);
                
                if (!allPools) {
                    throw new Error("No se pudieron obtener pools");
                }
                
                const normalizedSui = normalizeStructTag(SUI_COIN_TYPE);
                const normalizedWal = normalizeStructTag(WAL_COIN_TYPE);

                const bestPool = allPools.find(p => 
                    (normalizeStructTag(p.coinTypeA) === normalizedSui && normalizeStructTag(p.coinTypeB) === normalizedWal) ||
                    (normalizeStructTag(p.coinTypeA) === normalizedWal && normalizeStructTag(p.coinTypeB) === normalizedSui)
                );

                if (!bestPool) {
                    throw new Error("No se encontró pool para SUI/WAL");
                }
                
                console.log('✅ Pool encontrado:', bestPool.poolAddress);
                setPoolData(bestPool);

                // Calcular cotización usando preswap - COMO EN EL SCRIPT QUE FUNCIONA
                console.log('📊 Calculando cotización...');
                const amountInMist = parseFloat(fromAmount) * (10 ** SUI_DECIMALS);
                
                const a2b = normalizeStructTag(bestPool.coinTypeA) === normalizedSui;
                
                const preswapResultLocal = await sdk.Swap.preswap({
                    pool: bestPool,
                    currentSqrtPrice: bestPool.current_sqrt_price,
                    coinTypeA: bestPool.coinTypeA,
                    coinTypeB: bestPool.coinTypeB,
                    decimalsA: SUI_DECIMALS,
                    decimalsB: WAL_DECIMALS,
                    a2b: a2b,
                    byAmountIn: true,
                    amount: amountInMist.toString(),
                });

                if (!preswapResultLocal) {
                    throw new Error("Preswap no devolvió resultado válido");
                }
                
                console.log('📊 Cotización obtenida:', preswapResultLocal);
                
                const estimatedWAL = (Number(preswapResultLocal.estimatedAmountOut) / (10 ** WAL_DECIMALS)).toFixed(4);
                setToAmount(estimatedWAL);
                setPreswapResult(preswapResultLocal);
                console.log('✅ Cotización procesada:', estimatedWAL, 'WAL');

            } catch (error: any) {
                console.error("❌ Failed to get quote:", error);
                setToAmount('Quote unavailable');
                toast({ 
                    variant: "destructive", 
                    title: "❌ Quote Failed", 
                    description: error.message || "Failed to get quote" 
                });
            } finally {
                setIsFetchingQuote(false);
            }
        }
    }, [fromAmount, account, toast]);

    useEffect(() => {
        const debounce = setTimeout(() => { getQuote() }, 500);
        return () => clearTimeout(debounce);
    }, [fromAmount, getQuote]);

    const handleSwap = async () => {
        if (!account || !preswapResult || !poolData) {
            console.warn('⚠️ No account, preswap result or pool data');
            return;
        }

        try {
            console.log('🔄 Iniciando proceso de swap...');
            console.log('📋 Datos del usuario:', {
                address: account.address,
                fromAmount,
                preswapResult,
                poolData
            });

            // Validar balance del usuario
            if (!userBalance) {
                console.error('❌ No se pudo obtener el balance del usuario');
                toast({ 
                    variant: "destructive", 
                    title: "❌ Balance Error", 
                    description: "Could not fetch user balance" 
                });
                return;
            }

            const requiredAmount = parseFloat(fromAmount) * (10 ** SUI_DECIMALS);
            const userBalanceNum = parseFloat(userBalance);
            
            console.log('💰 Validando balance:', {
                required: requiredAmount,
                available: userBalanceNum,
                hasSufficient: userBalanceNum >= requiredAmount
            });

            if (userBalanceNum < requiredAmount) {
                const requiredSUI = (requiredAmount / (10 ** SUI_DECIMALS)).toFixed(4);
                const availableSUI = (userBalanceNum / (10 ** SUI_DECIMALS)).toFixed(4);
                
                console.error('❌ Balance insuficiente:', {
                    requiredSUI,
                    availableSUI
                });
                
                toast({ 
                    variant: "destructive", 
                    title: "❌ Insufficient Balance", 
                    description: `Need ${requiredSUI} SUI, but you have ${availableSUI} SUI` 
                });
                return;
            }

            // Inicializar SDK con sender address
            console.log('🔧 Inicializando Cetus SDK para swap...');
            const sdk = initCetusSDK({
                network: 'testnet',
                fullNodeUrl: 'https://fullnode.testnet.sui.io:443',
            });
            
            // ESTABLECER LA DIRECCIÓN DEL REMITENTE - CRÍTICO
            sdk.senderAddress = account.address;
            console.log('✅ SDK inicializado con sender address:', account.address);

            // Configurar parámetros del swap - COMO EN EL SCRIPT QUE FUNCIONA
            console.log('📊 Configurando parámetros del swap...');
            
            // Determinar dirección correcta
            const normalizedSui = normalizeStructTag(SUI_COIN_TYPE);
            const normalizedWal = normalizeStructTag(WAL_COIN_TYPE);
            const a2b = normalizeStructTag(poolData.coinTypeA) === normalizedSui;
            
            // Convertir amount a unidades base
            const amountInBaseUnits = new BN(parseFloat(fromAmount) * (10 ** SUI_DECIMALS));
            const amountStr = amountInBaseUnits.toString();
            
            // Configurar slippage
            const slippage = Percentage.fromDecimal(new Decimal(0.05)); // 5%
            const estimatedAmountOut = new BN(preswapResult.estimatedAmountOut);
            const amountLimit = adjustForSlippage(
                estimatedAmountOut,
                slippage,
                false // false para by_amount_in=true: mínimo output requerido
            );
            const amountLimitStr = amountLimit.toString();
            
            console.log('🔧 Parámetros para swap:', {
                pool_id: poolData.poolAddress,
                coinTypeA: poolData.coinTypeA,
                coinTypeB: poolData.coinTypeB,
                a2b: a2b,
                by_amount_in: true,
                amount: amountStr,
                amount_limit: amountLimitStr,
            });

            // Crear payload de swap usando el método estándar - CON DATOS VERIFICADOS
            console.log('🔨 Creando payload de swap...');
            
            const swapPayloadResult = sdk.Swap.createSwapTransactionPayload({
                pool_id: poolData.poolAddress,        // string verificado
                coinTypeA: poolData.coinTypeA,        // string verificado
                coinTypeB: poolData.coinTypeB,        // string verificado
                a2b: a2b,                             // boolean calculado
                by_amount_in: true,                   // boolean fijo
                amount: amountStr,                    // string convertido
                amount_limit: amountLimitStr,         // string calculado
            });
            
            // Esperar a que se resuelva si es una Promise
            const swapPayload: Transaction = await Promise.resolve(swapPayloadResult);
            
            console.log('✅ Payload de swap creado');

            // Ejecutar transacción
            console.log('🚀 Ejecutando transacción...');
            
            signAndExecuteTransaction(
                { transaction: swapPayload },
                {
                    onSuccess: (result) => {
                        console.log('✅ Swap completado exitosamente:', result);
                        console.log('📋 Digest:', result.digest);
                        console.log('📋 Effects:', result.effects);
                        
                        toast({ 
                            title: "✅ Swap Successful!", 
                            description: `You received ~${toAmount} WAL. Transaction: ${result.digest?.substring(0, 10)}...` 
                        });
                        onSwapSuccess();
                    },
                    onError: (error) => {
                        console.error("❌ Error en la transacción:", error);
                        toast({ 
                            variant: "destructive", 
                            title: "❌ Swap Failed", 
                            description: error.message || "Transaction failed" 
                        });
                    }
                }
            );

        } catch (error: any) {
            console.error("❌ Swap failed:", error);
            console.error("❌ Error stack:", error.stack);
            
            toast({ 
                variant: "destructive", 
                title: "❌ Swap Failed", 
                description: error.message || "Unknown error occurred" 
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-background/50 space-y-2">
                <Label>You Pay</Label>
                <div className="flex justify-between items-center">
                    <Input 
                        type="number" 
                        className="text-xl font-bold border-none p-0 focus-visible:ring-0" 
                        value={fromAmount} 
                        onChange={(e) => setFromAmount(e.target.value)} 
                        min="0"
                        step="0.1"
                    />
                    <span className="font-bold">SUI</span>
                </div>
                {userBalance && (
                    <p className="text-sm text-muted-foreground">
                        Balance: {(parseFloat(userBalance) / (10 ** SUI_DECIMALS)).toFixed(4)} SUI
                    </p>
                )}
            </div>
            <div className="flex justify-center -my-2 z-10 relative">
                <Button variant="ghost" size="icon" className="bg-background rounded-full border">
                    <ArrowDown className="w-4 h-4"/>
                </Button>
            </div>
            <div className="p-4 border rounded-lg bg-background/50 space-y-2">
                <Label>You Receive (estimate)</Label>
                <div className="flex justify-between items-center min-h-[40px]">
                    <p className="text-xl font-bold">{toAmount}</p>
                    <div className='flex items-center gap-2'>
                        {isFetchingQuote && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="font-bold">WAL</span>
                    </div>
                </div>
            </div>
            <Button 
                size="lg" 
                className="w-full btn-sui" 
                disabled={isPending || !account || !preswapResult || isFetchingQuote} 
                onClick={handleSwap}
            >
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Swap for WAL
            </Button>
        </div>
    );
}
