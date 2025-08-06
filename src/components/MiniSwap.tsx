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
            try {
                const response = await fetch('/api/swap/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        fromCoinType, 
                        toCoinType, 
                        amount: fromAmount,
                        decimalsA: SUI_DECIMALS,
                        decimalsB: WAL_DECIMALS,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('❌ Error en API quote:', errorData);
                    throw new Error(errorData.error || "Failed to fetch quote from API");
                }
                
                const result = await response.json();
                console.log('📊 Cotización obtenida:', result);
                
                const estimatedWAL = (Number(result.estimatedAmountOut) / (10 ** WAL_DECIMALS)).toFixed(4);
                setToAmount(estimatedWAL);
                setPreswapResult(result);
                console.log('✅ Cotización procesada:', estimatedWAL, 'WAL');

            } catch (error: any) {
                console.error("❌ Failed to get quote via API:", error);
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
    }, [fromAmount, fromCoinType, toCoinType, account, toast]);

    useEffect(() => {
        const debounce = setTimeout(() => { getQuote() }, 500);
        return () => clearTimeout(debounce);
    }, [fromAmount, getQuote]);

    const handleSwap = async () => {
        if (!account || !preswapResult) {
            console.warn('⚠️ No account or preswap result');
            return;
        }

        try {
            console.log('🔄 Iniciando proceso de swap...');
            console.log('📋 Datos del usuario:', {
                address: account.address,
                fromAmount,
                preswapResult
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
            console.log('🔧 Inicializando Cetus SDK...');
            const sdk = initCetusSDK({
                network: 'testnet',
                fullNodeUrl: 'https://fullnode.testnet.sui.io:443',
            });
            
            // ESTABLECER LA DIRECCIÓN DEL REMITENTE
            sdk.senderAddress = account.address;
            
            console.log('✅ SDK inicializado con sender address:', account.address);

            // Configurar slippage
            console.log('📊 Configurando slippage...');
            const slippage = Percentage.fromDecimal(new Decimal(0.05));
            
            // Ajustar el amount_limit
            const estimatedAmountOut = new BN(preswapResult.estimatedAmountOut);
            const amountLimit = adjustForSlippage(
                estimatedAmountOut,
                slippage,
                false // false para obtener el mínimo output requerido
            );
            console.log('✅ Slippage configurado:', {
                slippage: slippage.toString(),
                amountLimit: amountLimit.toString(),
                estimatedAmountOut: estimatedAmountOut.toString()
            });

            // Convertir amount a unidades base
            console.log('🔢 Convirtiendo amount a unidades base...');
            const amountInBaseUnits = new BN(parseFloat(fromAmount) * (10 ** SUI_DECIMALS));
            console.log('✅ Amount convertido:', {
                original: fromAmount,
                baseUnits: amountInBaseUnits.toString()
            });

            // Validar datos del preswapResult
            console.log('📋 Validando preswapResult:', preswapResult);
            
            const poolAddress = preswapResult.poolAddress;
            const coinTypeA = preswapResult.fromCoinType || fromCoinType;
            const coinTypeB = preswapResult.toCoinType || toCoinType;
            
            // Corregir a2b según la dirección del swap
            let a2b = true; // SUI -> WAL siempre es a2b = true
            if (coinTypeA.includes('wal::WAL') && coinTypeB.includes('sui::SUI')) {
                a2b = false; // WAL -> SUI sería a2b = false
            }
            
            console.log('🔧 Dirección del swap:', {
                coinTypeA,
                coinTypeB,
                a2b
            });

            // Crear payload de swap sin transferencia usando el método de la documentación
            console.log('🔨 Creando payload de swap sin transferencia...');
            
            const swapPayloadResult = sdk.Swap.createSwapTransactionWithoutTransferCoinsPayload({
                pool_id: poolAddress,
                coinTypeA: coinTypeA,
                coinTypeB: coinTypeB,
                a2b: a2b,
                by_amount_in: true,
                amount: amountInBaseUnits.toString(),
                amount_limit: amountLimit.toString(),
            });
            
            // Esperar a que se resuelva si es una Promise
            const swapPayload = await Promise.resolve(swapPayloadResult);
            
            console.log('✅ Payload de swap sin transferencia creado');

            // Construir la transacción completa manualmente
            console.log('🔨 Construyendo transacción completa...');
            const { tx: swapTx, coinsAB } = swapPayload;
            
            // Transferir los coins resultantes al usuario
            swapTx.transferObjects([coinsAB], swapTx.pure(account.address));
            
            console.log('✅ Transacción completa construida');

            // Ejecutar transacción
            console.log('🚀 Ejecutando transacción...');
            
            signAndExecuteTransaction(
                { transaction: swapTx },
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
