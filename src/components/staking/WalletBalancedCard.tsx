// src/components/staking/WalletBalanceCard.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, Wallet } from "lucide-react";

interface WalletBalanceCardProps {
    balance: number;
    isLoading: boolean;
    tokenSymbol?: string; // Prop opcional
}

export function WalletBalanceCard({ balance, isLoading, tokenSymbol = "TKT" }: WalletBalanceCardProps) {
    return (
        <Card className="glass-card card-hover">
            <CardHeader><CardTitle className="flex items-center text-foreground"><Wallet className="w-6 h-6 mr-3 text-blue-500"/> Tu Billetera</CardTitle></CardHeader>
            <CardContent>
                <div className="flex justify-between items-center text-muted-foreground">
                    <span>Balance de {tokenSymbol}:</span>
                    {isLoading ? <Loader className="w-5 h-5 animate-spin"/> : <span className="font-bold text-2xl text-blue-500">{balance.toLocaleString('en-US', {maximumFractionDigits: 2})}</span>}
                </div>
            </CardContent>
        </Card>
    );
}