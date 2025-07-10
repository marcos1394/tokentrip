'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, PiggyBank, TrendingUp, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PoolStatsCardProps {
    totalStaked: number;
    apy: number; // APY should be passed as a percentage, e.g., 8.5 for 8.5%
    isLoading: boolean;
    tokenSymbol?: string;
}

export function PoolStatsCard({ totalStaked, apy, isLoading, tokenSymbol = "TKT" }: PoolStatsCardProps) {
    
    // Skeleton UI for loading state
    if (isLoading) {
        return (
            <Card className="glass-card">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-8 w-3/4" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-8 w-1/3" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card card-hover">
            <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                    <PiggyBank className="w-6 h-6 mr-3 text-primary"/> Pool Statistics
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Total Staked
                    </div>
                    <div className="text-3xl font-bold text-primary">
                        {totalStaked.toLocaleString('en-US', {maximumFractionDigits: 0})} {tokenSymbol}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Estimated APY (in SUI)
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-3 w-3 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Annual Percentage Yield is estimated and subject to change.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="text-3xl font-bold text-green-500">
                        {apy.toFixed(2)}%
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}