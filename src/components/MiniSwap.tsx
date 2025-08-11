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
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';
import { suiConfig } from '@/config/sui';

interface MiniSwapProps {
    poolId: string;
    fromCoinType: string;
    fromCoinDecimals: number;
    fromCoinSymbol: string;
    toCoinType: string;
    toCoinDecimals: number;
    toCoinSymbol: string;
    onSwapSuccess: () => void;
}

export function MiniSwap({ 
    poolId,
    fromCoinType, 
    fromCoinDecimals,
    fromCoinSymbol,
    toCoinType,
    toCoinDecimals,
    toCoinSymbol,
    onSwapSuccess 
}: MiniSwapProps) {
    const account = useCurrentAccount();
    const { toast } = useToast();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const [fromAmount, setFromAmount] = useState('1');
    const [toAmount, setToAmount] = useState('');
    const [isFetchingQuote, setIsFetchingQuote] = useState(false);
    const [preswapResult, setPreswapResult] = useState<any>(null);
    const [userBalance, setUserBalance] = useState<string | null>(null);
    const [poolData, setPoolData] = useState<any>(null);

    const getUserBalance = useCallback(async () => {
        if (!account) return;
        try {
            const client = new SuiClient({ url: getFullnodeUrl('testnet') });
            const balanceResponse = await client.getBalance({
                owner: account.address,
                coinType: fromCoinType,
            });
            setUserBalance(balanceResponse.totalBalance);
        } catch (error) {
            console.error('❌ Error fetching balance:', error);
            setUserBalance(null);
        }
    }, [account, fromCoinType]);

    // En src/components/MiniSwap.tsx

const getQuote = useCallback(async () => {
    if (parseFloat(fromAmount) <= 0 || !account) {
        setToAmount('');
        setPreswapResult(null);
        return;
    }
    
    setIsFetchingQuote(true);
    console.log(`[QUOTE] Iniciando cotización para ${fromAmount} ${fromCoinSymbol}...`);

    try {
        const sdk = initCetusSDK({ network: 'testnet' });
        
        const pool = await sdk.Pool.getPool(poolId);
        if (!pool) {
            throw new Error(`Pool with ID ${poolId} not found.`);
        }
        setPoolData(pool);
        console.log('[QUOTE] Pool encontrado:', pool);

        const amountInMist = new Decimal(fromAmount).mul(new Decimal(10).pow(fromCoinDecimals));
        const a2b = normalizeStructTag(pool.coinTypeA) === normalizeStructTag(fromCoinType);

        const swapParams = {
            pool: pool,
            currentSqrtPrice: pool.current_sqrt_price,
            coinTypeA: pool.coinTypeA,
            coinTypeB: pool.coinTypeB,
            decimalsA: a2b ? fromCoinDecimals : toCoinDecimals,
            decimalsB: a2b ? toCoinDecimals : fromCoinDecimals,
            a2b: a2b,
            byAmountIn: true,
            amount: amountInMist.toString(),
        };
        console.log('[QUOTE] Parámetros para preswap:', swapParams);

        const preswapResultLocal = await sdk.Swap.preswap(swapParams);
        
        if (!preswapResultLocal) {
            throw new Error("Could not calculate a valid swap quote.");
        }
        console.log('[QUOTE] Resultado de preswap:', preswapResultLocal);
        
        const estimatedAmountOut = new Decimal(preswapResultLocal.estimatedAmountOut).div(new Decimal(10).pow(toCoinDecimals));
        setToAmount(estimatedAmountOut.toFixed(4));
        setPreswapResult(preswapResultLocal);
        console.log(`[QUOTE] Monto final estimado: ${estimatedAmountOut.toFixed(4)} ${toCoinSymbol}`);

    } catch (error: any) {
        console.error("❌ Failed to get quote:", error);
        setToAmount('Error');
    } finally {
        setIsFetchingQuote(false);
    }
}, [fromAmount, account, poolId, fromCoinType, fromCoinDecimals, toCoinType, toCoinDecimals, fromCoinSymbol, toCoinSymbol]);

    useEffect(() => {
        getUserBalance();
        const debounce = setTimeout(() => getQuote(), 500);
        return () => clearTimeout(debounce);
    }, [fromAmount, getQuote, getUserBalance]);

    const handleSwap = async () => {
        if (!account || !preswapResult || !poolData) return;

        try {
            const sdk = initCetusSDK({ network: 'testnet' });
            sdk.senderAddress = account.address;

            const amountInBaseUnits = new BN(preswapResult.amount);
            const estimatedAmountOut = new BN(preswapResult.estimatedAmountOut);
            const slippage = Percentage.fromDecimal(new Decimal(0.05)); // 5% slippage
            const amountLimit = adjustForSlippage(estimatedAmountOut, slippage, false);
            
            const swapPayload = await sdk.Swap.createSwapTransactionPayload({
                pool_id: poolData.poolAddress,
                coinTypeA: poolData.coinTypeA,
                coinTypeB: poolData.coinTypeB,
                a2b: preswapResult.a2b,
                by_amount_in: true,
                amount: amountInBaseUnits.toString(),
                amount_limit: amountLimit.toString(),
            });

            signAndExecuteTransaction(
                { transaction: swapPayload },
                {
                    onSuccess: (result) => {
                        toast({ 
                            title: "✅ Swap Successful!", 
                            description: `You received ~${toAmount} ${toCoinSymbol}.`
                        });
                        onSwapSuccess();
                        getUserBalance(); // Refresh balance after swap
                    },
                    onError: (error) => {
                        toast({ 
                            variant: "destructive", 
                            title: "❌ Swap Failed", 
                            description: error.message || "Transaction failed. Check console for details." 
                        });
                    }
                }
            );
        } catch (error: any) {
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
                <Label>Pagas</Label>
                <div className="flex justify-between items-center">
                    <Input 
                        type="number" 
                        className="text-xl font-bold border-none p-0 focus-visible:ring-0" 
                        value={fromAmount} 
                        onChange={(e) => setFromAmount(e.target.value)} 
                    />
                    <span className="font-bold">{fromCoinSymbol}</span>
                </div>
                {userBalance && (
                    <p className="text-sm text-muted-foreground">
                        Balance: {(parseFloat(userBalance) / (10 ** fromCoinDecimals)).toFixed(4)} {fromCoinSymbol}
                    </p>
                )}
            </div>
            <div className="flex justify-center -my-2 z-10 relative">
                <Button variant="ghost" size="icon" className="bg-background rounded-full border">
                    <ArrowDown className="w-4 h-4"/>
                </Button>
            </div>
            <div className="p-4 border rounded-lg bg-background/50 space-y-2">
                <Label>Recibes (estimado)</Label>
                <div className="flex justify-between items-center min-h-[40px]">
                    <p className="text-xl font-bold">{toAmount}</p>
                    <div className='flex items-center gap-2'>
                        {isFetchingQuote && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="font-bold">{toCoinSymbol}</span>
                    </div>
                </div>
            </div>
            <Button 
                size="lg" 
                className="w-full btn-sui" 
                disabled={isPending || !account || !preswapResult || isFetchingQuote || parseFloat(fromAmount) <= 0} 
                onClick={handleSwap}
            >
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Intercambiar por {toCoinSymbol}
            </Button>
        </div>
    );
}