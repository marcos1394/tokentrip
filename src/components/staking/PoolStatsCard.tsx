// src/components/staking/PoolStatsCard.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, PiggyBank } from "lucide-react";

interface PoolStatsCardProps {
    totalStaked: number;
    apy: number;
    isLoading: boolean;
    tokenSymbol?: string; // Prop opcional para el símbolo
}

export function PoolStatsCard({ totalStaked, apy, isLoading, tokenSymbol = "TKT" }: PoolStatsCardProps) {
    return (
        <Card className="glass-card card-hover">
            <CardHeader><CardTitle className="flex items-center text-foreground"><PiggyBank className="w-6 h-6 mr-3 text-primary"/> Estado del Pool</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-muted-foreground">
                    <span>Total en Staking:</span>
                    {isLoading ? <Loader className="w-5 h-5 animate-spin"/> : <span className="font-bold text-2xl text-primary">{totalStaked.toLocaleString('en-US', {maximumFractionDigits: 2})} {tokenSymbol}</span>}
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                    <span>APY Estimado (en SUI):</span>
                    <span className="font-bold text-lg text-green-500">{(apy * 100).toFixed(2)}%</span>
                </div>
            </CardContent>
        </Card>
    );
}