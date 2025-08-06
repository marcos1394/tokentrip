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
            console.log('🔄 [BALANCE] Obteniendo balance del usuario:', account.address);
            const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
            
            const balanceResponse = await client.getBalance({
                owner: account.address,
                coinType: '0x2::sui::SUI',
            });
            
            console.log('💰 [BALANCE] Balance obtenido:', JSON.stringify(balanceResponse, null, 2));
            setUserBalance(balanceResponse.totalBalance);
            
        } catch (error) {
            console.error('❌ [BALANCE] Error obteniendo balance:', error);
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
            console.log('🔄 [QUOTE] Iniciando obtención de cotización para:', fromAmount, 'SUI');
            setIsFetchingQuote(true);
            setPreswapResult(null);
            setPoolData(null);
            
            try {
                // Inicializar SDK para obtener pools
                console.log('🔧 [QUOTE] Inicializando Cetus SDK para obtener pools...');
                const sdk = initCetusSDK({ network: 'testnet' });
                
                // Obtener pools y encontrar el correcto - COMO EN EL SCRIPT QUE FUNCIONA
                console.log('🔍 [QUOTE] Buscando pool SUI/WAL...');
                const allPools = await sdk.Pool.getPoolsWithPage([]);
                
                if (!allPools) {
                    throw new Error("No se pudieron obtener pools");
                }
                
                console.log('📋 [QUOTE] Total pools encontrados:', allPools.length);
                
                const normalizedSui = normalizeStructTag(SUI_COIN_TYPE);
                const normalizedWal = normalizeStructTag(WAL_COIN_TYPE);

                const bestPool = allPools.find(p => {
                    const normA = normalizeStructTag(p.coinTypeA);
                    const normB = normalizeStructTag(p.coinTypeB);
                    const match = (normA === normalizedSui && normB === normalizedWal) ||
                                 (normA === normalizedWal && normB === normalizedSui);
                    console.log('🔍 [QUOTE] Evaluando pool:', {
                        poolAddress: p.poolAddress,
                        coinTypeA: p.coinTypeA,
                        normalizedA: normA,
                        coinTypeB: p.coinTypeB,
                        normalizedB: normB,
                        isMatch: match
                    });
                    return match;
                });

                if (!bestPool) {
                    throw new Error("No se encontró pool para SUI/WAL");
                }
                
                console.log('✅ [QUOTE] Pool encontrado:', {
                    poolAddress: bestPool.poolAddress,
                    coinTypeA: bestPool.coinTypeA,
                    coinTypeB: bestPool.coinTypeB,
                    current_sqrt_price: bestPool.current_sqrt_price,
                    normalizedA: normalizeStructTag(bestPool.coinTypeA),
                    normalizedB: normalizeStructTag(bestPool.coinTypeB)
                });
                setPoolData(bestPool);

                // Calcular cotización usando preswap - COMO EN EL SCRIPT QUE FUNCIONA
                console.log('📊 [QUOTE] Calculando cotización...');
                const amountInMist = parseFloat(fromAmount) * (10 ** SUI_DECIMALS);
                
                // FORZAR el orden SUI -> WAL como en el script que funciona
                const swapParams = {
                    pool: bestPool,
                    currentSqrtPrice: bestPool.current_sqrt_price,
                    coinTypeA: SUI_COIN_TYPE,  // FORZAR SUI como A
                    coinTypeB: WAL_COIN_TYPE,  // FORZAR WAL como B
                    decimalsA: SUI_DECIMALS,
                    decimalsB: WAL_DECIMALS,
                    a2b: true,                 // FORZAR a2b = true para SUI -> WAL
                    byAmountIn: true,
                    amount: amountInMist.toString(),
                };
                
                console.log('🔧 [QUOTE] Parámetros forzados para preswap:', JSON.stringify(swapParams, null, 2));
                
                const preswapResultLocal = await sdk.Swap.preswap(swapParams);

                if (!preswapResultLocal) {
                    throw new Error("Preswap no devolvió resultado válido");
                }
                
                console.log('📊 [QUOTE] Cotización obtenida:', JSON.stringify(preswapResultLocal, null, 2));
                
                const estimatedWAL = (Number(preswapResultLocal.estimatedAmountOut) / (10 ** WAL_DECIMALS)).toFixed(4);
                setToAmount(estimatedWAL);
                setPreswapResult(preswapResultLocal);
                console.log('✅ [QUOTE] Cotización procesada:', estimatedWAL, 'WAL');

            } catch (error: any) {
                console.error("❌ [QUOTE] Failed to get quote:", error);
                console.error("❌ [QUOTE] Error stack:", error.stack);
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
            console.warn('⚠️ [SWAP] No account, preswap result or pool data');
            return;
        }

        try {
            console.log('🔄 [SWAP] Iniciando proceso de swap...');
            console.log('📋 [SWAP] Datos del usuario:', {
                address: account.address,
                fromAmount,
                // preswapResult: JSON.stringify(preswapResult, null, 2),
                // poolData: JSON.stringify(poolData, null, 2)
            });

            // Validar balance del usuario
            if (!userBalance) {
                console.error('❌ [SWAP] No se pudo obtener el balance del usuario');
                toast({ 
                    variant: "destructive", 
                    title: "❌ Balance Error", 
                    description: "Could not fetch user balance" 
                });
                return;
            }

            const requiredAmount = parseFloat(fromAmount) * (10 ** SUI_DECIMALS);
            const userBalanceNum = parseFloat(userBalance);
            
            console.log('💰 [SWAP] Validando balance:', {
                required: requiredAmount,
                available: userBalanceNum,
                hasSufficient: userBalanceNum >= requiredAmount
            });

            if (userBalanceNum < requiredAmount) {
                const requiredSUI = (requiredAmount / (10 ** SUI_DECIMALS)).toFixed(4);
                const availableSUI = (userBalanceNum / (10 ** SUI_DECIMALS)).toFixed(4);
                
                console.error('❌ [SWAP] Balance insuficiente:', {
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
            console.log('🔧 [SWAP] Inicializando Cetus SDK para swap...');
            const sdk = initCetusSDK({
                network: 'testnet',
                fullNodeUrl: 'https://fullnode.testnet.sui.io:443',
            });
            
            // ESTABLECER LA DIRECCIÓN DEL REMITENTE - CRÍTICO
            console.log('🔧 [SWAP] Estableciendo sender address:', account.address);
            sdk.senderAddress = account.address;
            console.log('✅ [SWAP] SDK inicializado con sender address:', account.address);

            // Configurar parámetros del swap - FORZAR el orden como en el script
            console.log('📊 [SWAP] Configurando parámetros del swap FORZADOS...');
            
            // FORZAR el orden SUI -> WAL como en el script que funciona
            const coinTypeA = SUI_COIN_TYPE;  // FORZAR SUI como A
            const coinTypeB = WAL_COIN_TYPE;  // FORZAR WAL como B
            const a2b = true;                 // FORZAR a2b = true para SUI -> WAL
            
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
            
            console.log('🔧 [SWAP] Parámetros FORZADOS para swap:', {
                pool_id: poolData.poolAddress,
                coinTypeA: coinTypeA,          // FORZADO
                coinTypeB: coinTypeB,          // FORZADO
                a2b: a2b,                      // FORZADO
                by_amount_in: true,
                amount: amountStr,
                amount_limit: amountLimitStr,
            });

            // VALIDACIÓN EXTRA DE PARÁMETROS
            console.log('🔍 [SWAP] Validando parámetros antes de crear payload...');
            if (!poolData.poolAddress) {
                throw new Error("Pool address is missing");
            }
            if (!coinTypeA || !coinTypeB) {
                throw new Error("Coin types are missing");
            }
            if (!amountStr || amountStr === "0") {
                throw new Error("Invalid amount");
            }
            if (!amountLimitStr) {
                throw new Error("Invalid amount limit");
            }
            console.log('✅ [SWAP] Todos los parámetros validados correctamente');

            // Crear payload de swap usando el método estándar - CON DATOS FORZADOS
            console.log('🔨 [SWAP] Creando payload de swap...');
            
            const swapParams = {
                pool_id: poolData.poolAddress,        // string verificado
                coinTypeA: coinTypeA,                 // FORZADO
                coinTypeB: coinTypeB,                 // FORZADO
                a2b: a2b,                             // FORZADO
                by_amount_in: true,                   // boolean fijo
                amount: amountStr,                    // string convertido
                amount_limit: amountLimitStr,         // string calculado
            };
            
            console.log('📋 [SWAP] Parámetros enviados a createSwapTransactionPayload:', JSON.stringify(swapParams, null, 2));
            
            const swapPayloadResult = sdk.Swap.createSwapTransactionPayload(swapParams);
            
            // Esperar a que se resuelva si es una Promise
            console.log('⏳ [SWAP] Esperando resolución del payload...');
            const swapPayload: Transaction = await Promise.resolve(swapPayloadResult);
            
            console.log('✅ [SWAP] Payload de swap creado exitosamente');
            console.log('📋 [SWAP] Tipo de payload:', typeof swapPayload);
            console.log('📋 [SWAP] Payload tiene toJSON:', typeof swapPayload.toJSON === 'function');
            
            // Intentar inspeccionar el payload si es posible
            try {
                console.log('📋 [SWAP] Payload inspect:', JSON.stringify(swapPayload, null, 2));
            } catch (inspectError: any) { // CORREGIDO: Tipado explícito
                console.log('📋 [SWAP] No se pudo inspeccionar el payload:', inspectError?.message || 'Unknown error');
            }

            // Ejecutar transacción
            console.log('🚀 [SWAP] Ejecutando transacción...');
            console.log('📋 [SWAP] Datos de transacción a enviar:', {
                hasTransaction: !!swapPayload,
                transactionType: typeof swapPayload
            });
            
            signAndExecuteTransaction(
                { transaction: swapPayload },
                {
                    onSuccess: (result) => {
                        console.log('✅ [SWAP] Swap completado exitosamente:', result);
                        console.log('📋 [SWAP] Digest:', result.digest);
                        console.log('📋 [SWAP] Effects:', JSON.stringify(result.effects, null, 2));
                        
                        toast({ 
                            title: "✅ Swap Successful!", 
                            description: `You received ~${toAmount} WAL. Transaction: ${result.digest?.substring(0, 10)}...` 
                        });
                        onSwapSuccess();
                    },
                    onError: (error) => {
                        console.error("❌ [SWAP] Error en la transacción:", error);
                        console.error("❌ [SWAP] Error completo:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
                        
                        // Loggear más detalles del error si es posible
                        if (error.message) {
                            console.error("❌ [SWAP] Mensaje de error:", error.message);
                        }
                        if (error.stack) {
                            console.error("❌ [SWAP] Stack trace:", error.stack);
                        }
                        
                        toast({ 
                            variant: "destructive", 
                            title: "❌ Swap Failed", 
                            description: error.message || "Transaction failed. Check console for details." 
                        });
                    }
                }
            );

        } catch (error: any) {
            console.error("❌ [SWAP] Swap failed:", error);
            console.error("❌ [SWAP] Error stack:", error.stack);
            
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
