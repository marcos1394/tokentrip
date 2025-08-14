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
    const [quoteResult, setQuoteResult] = useState<any>(null);
    const [userBalance, setUserBalance] = useState<string | null>(null);

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

    const getQuote = useCallback(async () => {
        if (parseFloat(fromAmount) <= 0 || !account) {
            setToAmount('');
            setQuoteResult(null);
            return;
        }
        
        setIsFetchingQuote(true);
        const requestBody = {
            poolId,
            fromCoinType,
            toCoinType,
            amount: fromAmount,
            fromCoinDecimals,
            toCoinDecimals,
        };
        
        console.log("🚀 [MINISWAP] Enviando a la API para cotización:", requestBody);

        try {
            const response = await fetch('/api/swap/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch quote from API');
            }

            const result = await response.json();
            console.log("✅ [MINISWAP] Respuesta recibida de la API:", result);
            
            const estimatedAmountOut = new Decimal(result.estimatedAmountOut).div(new Decimal(10).pow(toCoinDecimals));
            setToAmount(estimatedAmountOut.toFixed(4));
            setQuoteResult(result);

        } catch (error: any) {
            console.error("❌ [MINISWAP] Falló la obtención de cotización:", error);
            setToAmount('Error');
            setQuoteResult(null);
        } finally {
            setIsFetchingQuote(false);
        }
    }, [fromAmount, account, poolId, fromCoinType, toCoinType, fromCoinDecimals, toCoinDecimals]);

    useEffect(() => {
        getUserBalance();
        const debounce = setTimeout(() => { getQuote() }, 500);
        return () => clearTimeout(debounce);
    }, [fromAmount, getQuote, getUserBalance]);

    const handleSwap = async () => {
        if (!account || !quoteResult) {
            console.error("[SWAP] Faltan datos para el swap (cuenta o cotización)");
            return;
        }

        try {
            console.log("[SWAP] 1. Iniciando swap...");
            
            // --- LA CORRECCIÓN ESTÁ AQUÍ ---
            const client = new SuiClient({ url: getFullnodeUrl('testnet') });
            const sdk = initCetusSDK({
                network: 'testnet',
                suiClient: client // Pasamos el cliente durante la inicialización
            });
            sdk.senderAddress = account.address;

            console.log("[SWAP] 2. SDK inicializado con SuiClient.");

            const amountInBaseUnits = new BN(quoteResult.amount);
            const estimatedAmountOut = new BN(quoteResult.estimatedAmountOut);
            const slippage = Percentage.fromDecimal(new Decimal(0.05)); // 5%
            const amountLimit = adjustForSlippage(estimatedAmountOut, slippage, false);
            
            const payloadParams = {
                pool_id: quoteResult.poolAddress,
                coinTypeA: quoteResult.coinTypeA,
                coinTypeB: quoteResult.coinTypeB,
                a2b: quoteResult.aToB,
                by_amount_in: true,
                amount: amountInBaseUnits.toString(),
                amount_limit: amountLimit.toString(),
            };
            console.log("[SWAP] 3. Parámetros para crear el payload:", payloadParams);
            
            const swapPayload = await sdk.Swap.createSwapTransactionPayload(payloadParams);
            console.log("[SWAP] 4. Payload de transacción creado.", swapPayload);

            signAndExecuteTransaction(
                { transaction: swapPayload },
                {
                    onSuccess: (result) => {
                        console.log("[SWAP] 5. Transacción exitosa:", result.digest);
                        toast({ 
                            title: "✅ Swap Successful!", 
                            description: `You received ~${toAmount} ${toCoinSymbol}.` 
                        });
                        onSwapSuccess();
                        getUserBalance();
                    },
                    onError: (error) => {
                        console.error("[SWAP] 5. Error en la transacción:", error);
                        toast({ 
                            variant: "destructive", 
                            title: "❌ Swap Failed", 
                            description: error.message || "Transaction failed." 
                        });
                    }
                }
            );
        } catch (error: any) {
            console.error("[SWAP] 5. Error crítico en handleSwap:", error);
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
                disabled={isPending || !account || !quoteResult || isFetchingQuote || parseFloat(fromAmount) <= 0} 
                onClick={handleSwap}
            >
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Intercambiar por {toCoinSymbol}
            </Button>
        </div>
    );
}
