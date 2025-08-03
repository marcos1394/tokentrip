'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { normalizeStructTag } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { Network, TurbosSdk } from 'turbos-clmm-sdk';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowDown } from 'lucide-react';
import { suiConfig } from '@/config/sui'; // <-- Importar la configuración

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
                const amountInMist = (parseFloat(fromAmount) * (10 ** SUI_DECIAMLS)).toString();
                
                // --- LÓGICA SIMPLIFICADA ---
                // 1. Obtener el pool directamente por su ID
                const pool = await sdk.pool.getPool(suiConfig.suiWalPoolId);
                const a2b = normalizeStructTag(pool.coin_a) === normalizeStructTag(fromCoinType);

                // 2. Calcular el resultado del swap con ese pool
                const [swapResult] = await sdk.trade.computeSwapResult({
                    pools: [{ pool: pool.objectId, a2b }],
                    address: account.address,
                    amountSpecified: amountInMist,
                    amountSpecifiedIsInput: true,
                });
                
                setToAmount((Number(swapResult.amount_b) / (10 ** WAL_DECIAMLS)).toFixed(4));
                setBestSwapResult({ ...swapResult, a2b });

            } catch (error: any) {
                console.error("Failed to get quote:", error);
                setToAmount('Quote unavailable');
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
            const nextTickIndex = sdk.math.bitsToNumber(bestSwapResult.tick_current_index.bits);

            const tx = await sdk.trade.swap({
                routes: [{
                    pool: bestSwapResult.pool,
                    a2b: bestSwapResult.a2b,
                    nextTickIndex,
                }],
                coinTypeA: fromCoinType,
                coinTypeB: toCoinType,
                address: account.address,
                amountA: bestSwapResult.amount_a,
                amountB: bestSwapResult.amount_b,
                amountSpecifiedIsInput: true,
                slippage: "0.1",
            });
            
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: "✅ Swap Successful!", description: `You received ~${toAmount} WAL.` });
            onSwapSuccess();
        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Swap Failed", description: error.message });
        }
    };

    // --- El JSX se mantiene igual ---
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