'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Network, TurbosSdk } from 'turbos-clmm-sdk'; // <-- 1. Se importa de Turbos
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowDown } from 'lucide-react';

// --- Configuración del SDK (TURBOS) ---
const sdk = new TurbosSdk(Network.testnet);
const SUI_DECIAMLS = 9;
const WAL_DECIAMLS = 9;

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
    const [bestSwapResult, setBestSwapResult] = useState<any>(null);

    const getQuote = useCallback(async () => {
        if (parseFloat(fromAmount) > 0 && account) {
            setIsFetchingQuote(true);
            setBestSwapResult(null);
            try {
                const amountInMist = parseFloat(fromAmount) * (10 ** SUI_DECIAMLS);
                
                // --- LÓGICA DE COTIZACIÓN (TURBOS) ---
                // 1. Encontrar el pool para SUI y WAL
                const pools = await sdk.pool.getPools({
                    coin_a: fromCoinType,
                    coin_b: toCoinType,
                });
                if (pools.length === 0) throw new Error("No Turbos liquidity pool found for this pair.");
                
                const bestPool = pools[0]; // Asumimos que el primero es el mejor

                // 2. Calcular el resultado del swap con ese pool
                const [swapResult] = await sdk.trade.computeSwapResult({
                    pools: [{ pool: bestPool.poolAddress, a2b: true }],
                    address: account.address,
                    amountSpecified: amountInMist.toString(),
                    amountSpecifiedIsInput: true,
                });

                setToAmount((Number(swapResult.amountCalculated) / (10 ** WAL_DECIAMLS)).toFixed(4));
                setBestSwapResult(swapResult);
            } catch (error: any) {
                console.error("Failed to get quote:", error);
                setToAmount('No pool found');
            } finally {
                setIsFetchingQuote(false);
            }
        } else {
            setToAmount('');
        }
    }, [fromAmount, fromCoinType, toCoinType, account]);

    useEffect(() => {
        const debounce = setTimeout(() => { getQuote() }, 500);
        return () => clearTimeout(debounce);
    }, [fromAmount, getQuote]);

    const handleSwap = async () => {
        if (!account || !bestSwapResult) return;
        try {
            // --- LÓGICA DE SWAP (TURBOS) ---
            const nextTickIndex = sdk.math.bitsToNumber(bestSwapResult.tickCurrentIndex.bits);

            const tx = await sdk.trade.swap({
                routes: [{
                    pool: bestSwapResult.pool,
                    a2b: true,
                    nextTickIndex,
                }],
                coinTypeA: fromCoinType,
                coinTypeB: toCoinType,
                address: account.address,
                amountA: bestSwapResult.amountA.toString(),
                amountB: bestSwapResult.amountB.toString(),
                amountSpecifiedIsInput: true,
                slippage: "0.1", // Slippage como string
            });
            
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: "✅ Swap Successful!", description: `You received ~${toAmount} WAL.` });
            onSwapSuccess();
        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Swap Failed", description: error.message });
        }
    };

    // El JSX se mantiene casi idéntico
    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-background/50 space-y-2">
                <Label>You Pay</Label>
                <div className="flex justify-between items-center">
                    <Input type="number" className="text-xl font-bold border-none p-0 focus-visible:ring-0" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} />
                    <span className="font-bold">SUI</span>
                </div>
            </div>
            <div className="flex justify-center -my-2 z-10 relative">
                <Button variant="ghost" size="icon" className="bg-background rounded-full border"><ArrowDown className="w-4 h-4"/></Button>
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
            <Button size="lg" className="w-full btn-sui" disabled={isPending || !account || !bestSwapResult || isFetchingQuote} onClick={handleSwap}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Swap for WAL
            </Button>
        </div>
    );
}