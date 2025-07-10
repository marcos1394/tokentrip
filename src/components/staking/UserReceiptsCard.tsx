// src/components/staking/UserReceiptsCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, Receipt, Gift, Unlock } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Interfaces y Helpers ---

export interface StakeReceipt {
    objectId: string;
    amount_staked: string;
    // --- CORRECCIÓN: Se marcan como opcionales con '?' ---
    rewards_earned?: string; 
    staked_at_ms?: string;
}

interface UserReceiptsCardProps {
    receipts: StakeReceipt[];
    isLoading: boolean;
    onClaim: (receiptId: string) => void;
    onUnstake: (receiptId: string) => void;
    isActionPending: boolean;
    tokenSymbol?: string;
}

// ... (la función timeAgo se mantiene igual)

function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
}

export function UserReceiptsCard({ 
    receipts, 
    isLoading, 
    onClaim, 
    onUnstake,
    isActionPending,
    tokenSymbol = "TKT" 
}: UserReceiptsCardProps) {
    
    return (
        <Card className="glass-card card-hover">
            <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                    <Receipt className="w-6 h-6 mr-3 text-cyan-500"/> My Stakes
                </CardTitle>
                <CardDescription>
                    These are your active stake positions. Claim rewards or unstake your principal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <LoadingSkeleton />}
                
                {!isLoading && receipts.length === 0 && (
                    <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                        <Receipt className="w-12 h-12" />
                        <p className="text-lg font-semibold">No Active Stakes</p>
                        <p>Stake some {tokenSymbol} to start earning rewards.</p>
                    </div>
                )}

                {!isLoading && receipts.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staked Amount</TableHead>
                                <TableHead className="text-center">Rewards Earned (SUI)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receipts.map((receipt) => {
                                const stakedAmount = Number(BigInt(receipt.amount_staked) / BigInt(10**9));
                                // --- CORRECCIÓN: Se usa '??' para manejar el valor opcional ---
                                const rewardsAmount = Number(BigInt(receipt.rewards_earned ?? '0') / BigInt(10**9));
                                
                                return (
                                    <TableRow key={receipt.objectId}>
                                        <TableCell>
                                            <div className="font-bold text-lg text-foreground">{stakedAmount.toLocaleString('en-US')}</div>
                                            <div className="text-xs text-muted-foreground">{tokenSymbol}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-green-500">
                                            {rewardsAmount > 0 ? rewardsAmount.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '...'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="btn-sui-outline" 
                                                onClick={() => onClaim(receipt.objectId)} 
                                                disabled={isActionPending}
                                            >
                                                {isActionPending ? <Loader className="w-4 h-4 animate-spin"/> : <Gift className="w-4 h-4" />}
                                                <span className="ml-2 hidden sm:inline">Claim</span>
                                            </Button>
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={() => onUnstake(receipt.objectId)} 
                                                disabled={isActionPending}
                                            >
                                                 {isActionPending ? <Loader className="w-4 h-4 animate-spin"/> : <Unlock className="w-4 h-4" />}
                                                <span className="ml-2 hidden sm:inline">Unstake</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}