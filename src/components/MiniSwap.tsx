'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CetusClmmSDK } from '@cetusprotocol/cetus-sui-clmm-sdk'; // Se importa la clase principal
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowDown } from 'lucide-react';

// --- Configuración del SDK (ACTUALIZADA) ---
// Se usa el nuevo método estático createSDK()
const sdk = CetusClmmSDK.createSDK({ network: 'testnet' });
const SUI_DECIAMLS = 9;
const WAL_DECIAMLS = 9;

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

    const [fromAmount, setFromAmount] = useState('0.1');
    const [toAmount, setToAmount] = useState('');
    const [isFetchingQuote, setIsFetchingQuote] = useState(false);
    const [bestSwapResult, setBestSwapResult] = useState<any>(null); // Guardamos el resultado para el swap

    const getQuote = useCallback(async () => {
        if (parseFloat(fromAmount) > 0) {
            setIsFetchingQuote(true);
            setBestSwapResult(null);
            try {
                const amountInMist = parseFloat(fromAmount) * (10 ** SUI_DECIAMLS);
                
                // --- LÓGICA DE COTIZACIÓN ACTUALIZADA ---
                // 1. Encontrar los mejores pools para este par de monedas
                const pools = await sdk.Router.getBestPoolsForSwap(fromCoinType, toCoinType, amountInMist);
                if (pools.length === 0) throw new Error("No liquidity pools found for this pair.");
                
                // 2. Calcular el monto usando el mejor pool
                const result = await sdk.Router.calculateAmountWithA({
                    pool: pools[0], // Usamos el primer resultado que es el mejor
                    coinTypeA: fromCoinType,
                    coinTypeB: toCoinType,
                    amountA: amountInMist,
                    byAmountIn: true,
                    slippage: 0.1
                });

                setToAmount((Number(result.amountB) / (10 ** WAL_DECIAMLS)).toFixed(4));
                setBestSwapResult(result); // Guardamos el resultado para usarlo en el swap
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
        const debounce = setTimeout(() => { getQuote() }, 500);
        return () => clearTimeout(debounce);
    }, [fromAmount, getQuote]);

    const handleSwap = async () => {
        if (!account || !bestSwapResult) return;
        try {
            const tx = new Transaction();
            
            // --- LÓGICA DE SWAP ACTUALIZADA ---
            const swapPayload = await sdk.Router.swapA2B({
                tx,
                pool: bestSwapResult.pool,
                coinTypeA: fromCoinType,
                coinTypeB: toCoinType,
                address: account.address,
                amountA: BigInt(bestSwapResult.amountA.toString()),
                amountB: BigInt(bestSwapResult.amountB.toString()),
                byAmountIn: true,
                slippage: 0.1
            });
            
            // `swapPayload` es la moneda que recibes, necesita ser transferida a tu dirección
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
            <Button size="lg" className="w-full btn-sui" disabled={isPending || !account || !bestSwapResult || isFetchingQuote} onClick={handleSwap}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Swap for WAL
            </Button>
        </div>
    );
}