'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";

// CORRECCIÓN: Se añade `tokenSymbol` a las props
interface StakeFormCardProps {
    stakeAmount: string;
    setStakeAmount: (value: string) => void;
    handleStake: () => void;
    isStakePending: boolean;
    isWalletConnected: boolean;
    userSuiBalance: number;
    balanceAfterStake: number;
    estimatedReturns: number;
    tokenSymbol?: string; // Se hace opcional con un valor por defecto
}

export function StakeFormCard({
    stakeAmount, setStakeAmount, handleStake, isStakePending, isWalletConnected,
    userSuiBalance, balanceAfterStake, estimatedReturns, tokenSymbol = "TKT"
}: StakeFormCardProps) {
    const stakeAmountNumber = parseFloat(stakeAmount) || 0;

    return (
        <Card className="glass-card card-hover">
            <CardHeader>
                {/* CORRECCIÓN: El título ahora es dinámico */}
                <CardTitle className="text-foreground">Depositar {tokenSymbol}</CardTitle>
                <CardDescription>Ingresa la cantidad de {tokenSymbol} que deseas poner en staking.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Input 
                        type="number" 
                        placeholder={`Ej: 100 ${tokenSymbol}`}
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        disabled={isStakePending || !isWalletConnected}
                        className="text-lg p-4"
                    />
                    {stakeAmountNumber > 0 && (
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg space-y-2">
                           <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Balance después del depósito:</span>
                              <span className="font-medium text-foreground">{balanceAfterStake >= 0 ? balanceAfterStake.toLocaleString('en-US', {maximumFractionDigits: 2}) : '0.00'} {tokenSymbol}</span>
                           </div>
                           <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Ganancia estimada (1 año en SUI):</span>
                              <span className="font-medium text-green-500">~ {estimatedReturns.toLocaleString('en-US', {maximumFractionDigits: 2})} SUI</span>
                           </div>
                        </div>
                    )}
                    <Button 
                        size="lg"
                        className="w-full text-lg py-6 text-white btn-sui"
                        onClick={handleStake}
                        disabled={isStakePending || !isWalletConnected || stakeAmountNumber <= 0 || stakeAmountNumber > userSuiBalance}
                    >
                        {isStakePending && <Loader className="w-5 h-5 mr-2 animate-spin" />}
                        {isStakePending ? "Depositando..." : "Hacer Stake"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}