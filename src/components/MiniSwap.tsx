// src/components/MiniSwap.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowDown } from 'lucide-react';

// --- Configuración del SDK ---
const sdk = initCetusSDK({ network: 'testnet' });

const SUI_DECIAMLS = 9;
const WAL_DECIAMLS = 9; // Walrus token tiene 9 decimales

interface MiniSwapProps {
    fromCoinType: string;
    toCoinType: string;
    onSwapSuccess: () => void;
}

export function MiniSwap({ fromCoinType, toCoinType, onSwapSuccess }: MiniSwapProps) {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { toast } = useToast();
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const [fromAmount, setFromAmount] = useState('0.1'); // Valor por defecto
    const [toAmount, setToAmount] = useState('');
    const [isFetchingQuote, setIsFetchingQuote] = useState(false);

    const getQuote = useCallback(async () => {
        if (parseFloat(fromAmount) > 0) {
            setIsFetchingQuote(true);
            try {
                const amountInMist = parseFloat(fromAmount) * (10 ** SUI_DECIAMLS);
                const bestResult = await sdk.Router.getBestSwapRouter(fromCoinType, toCoinType, amountInMist, true, 0.1);
                if (bestResult.amountOut > 0) {
                    setToAmount((bestResult.amountOut / (10 ** WAL_DECIAMLS)).toFixed(4));
                }
            } catch (error) {
                console.error("Failed to get quote:", error);
                setToAmount('No pool found');
            } finally {
                setIsFetchingQuote(false);
            }
        } else {
            setToAmount('');
        }
    }, [fromAmount, fromCoinType, toCoinType]);

    useEffect(() => {
        getQuote();
    }, [getQuote]);

    const handleSwap = async () => {
        if (!account || parseFloat(fromAmount) <= 0) return;
        try {
            const amountInMist = BigInt(Math.floor(parseFloat(fromAmount) * 1e9));
            const tx = new Transaction();
            
            const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist.toString())]);
            
            const swapPayload = await sdk.Router.swap(
                tx, fromCoinType, toCoinType,
                amountInMist, true,
                account.address, 0.1
            );
            
            tx.transferObjects([swapPayload], tx.pure.address(account.address));
            
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: "✅ Swap Successful!", description: `You received ~${toAmount} WAL.` });
            onSwapSuccess();
        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Swap Failed", description: error.message });
        }
    };

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
            <Button size="lg" className="w-full btn-sui" disabled={isPending || !account || !toAmount || isFetchingQuote} onClick={handleSwap}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Swap for WAL
            </Button>
        </div>
    );
}