'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { Label } from "@/components/ui/label";

interface StakeFormCardProps {
    stakeAmount: string;
    setStakeAmount: (value: string) => void;
    handleStake: () => void;
    isStakePending: boolean;
    isWalletConnected: boolean;
    userTktBalance: number;
    balanceAfterStake: number;
    estimatedReturns: number;
    tokenSymbol?: string;
}

export function StakeFormCard({
    stakeAmount, setStakeAmount, handleStake, isStakePending, isWalletConnected,
    userTktBalance, balanceAfterStake, estimatedReturns, tokenSymbol = "TKT"
}: StakeFormCardProps) {
    const stakeAmountNumber = parseFloat(stakeAmount) || 0;
    const hasInsufficientBalance = stakeAmountNumber > userTktBalance;

    const handleSetPercentage = (percentage: number) => {
        const amountToSet = (userTktBalance * percentage) / 100;
        setStakeAmount(amountToSet.toString());
    };

    return (
        <Card className="glass-card card-hover">
            <CardHeader>
                <CardTitle className="text-foreground">Stake {tokenSymbol}</CardTitle>
                <CardDescription>Enter the amount of {tokenSymbol} you wish to stake to earn rewards.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="stake-amount" className="text-muted-foreground">Amount</Label>
                            <span className="text-xs text-muted-foreground">
                                Available: {userTktBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <Input 
                            id="stake-amount"
                            type="number" 
                            placeholder={`e.g., 100 ${tokenSymbol}`}
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            disabled={isStakePending || !isWalletConnected}
                            className={`text-lg p-4 ${hasInsufficientBalance ? 'border-destructive' : ''}`}
                        />
                    </div>

                    {/* Botones de Acceso Rápido */}
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleSetPercentage(25)}>25%</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleSetPercentage(50)}>50%</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleSetPercentage(75)}>75%</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleSetPercentage(100)}>Max</Button>
                    </div>

                    {/* Resumen de la Transacción */}
                    {stakeAmountNumber > 0 && (
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3 text-sm">
                           <div className="flex justify-between">
                                <span className="text-muted-foreground">Your new balance will be:</span>
                                <span className="font-medium text-foreground">{balanceAfterStake >= 0 ? balanceAfterStake.toLocaleString('en-US', {maximumFractionDigits: 2}) : '0.00'} {tokenSymbol}</span>
                           </div>
                           <div className="flex justify-between">
                                <span className="text-muted-foreground">Est. Yearly Rewards (SUI):</span>
                                <span className="font-medium text-green-500">~ {estimatedReturns.toLocaleString('en-US', {maximumFractionDigits: 2})} SUI</span>
                           </div>
                        </div>
                    )}
                    
                    <div className="pt-2">
                        <Button 
                            size="lg"
                            className="w-full text-lg py-6 text-white btn-sui"
                            onClick={handleStake}
                            disabled={isStakePending || !isWalletConnected || stakeAmountNumber <= 0 || hasInsufficientBalance}
                        >
                            {isStakePending && <Loader className="w-5 h-5 mr-2 animate-spin" />}
                            {isStakePending ? "Staking..." : `Stake ${tokenSymbol}`}
                        </Button>
                        {hasInsufficientBalance && (
                            <p className="text-sm text-destructive text-center mt-2">Insufficient {tokenSymbol} balance.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}