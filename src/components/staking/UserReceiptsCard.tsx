// src/components/staking/UserReceiptsCard.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, Receipt, Gift } from "lucide-react";

interface StakeReceiptFields {
  id: { id: string };
  amount_staked: string;
}

interface UserReceiptsCardProps {
    receipts: StakeReceiptFields[];
    isLoading: boolean;
    onClaim: (receiptId: string) => void;
    isClaimPending: boolean;
    tokenSymbol?: string; // Prop opcional
}

export function UserReceiptsCard({ receipts, isLoading, onClaim, isClaimPending, tokenSymbol = "TKT" }: UserReceiptsCardProps) {
    return (
        <Card className="glass-card card-hover">
            <CardHeader>
                <CardTitle className="flex items-center text-foreground"><Receipt className="w-6 h-6 mr-3 text-cyan-500"/> Mis Depósitos</CardTitle>
                <CardDescription>Estos son tus recibos de staking. Las recompensas se pagan en SUI.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-muted-foreground">Cargando...</p>}
                {!isLoading && receipts.length === 0 && <p className="text-muted-foreground">No tienes depósitos activos.</p>}
                <div className="space-y-2">
                    {receipts.map((receipt) => (
                        <div key={receipt.id.id} className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-md gap-4">
                            <div className="flex flex-col">
                                <span className="font-mono text-xs text-muted-foreground truncate">ID: {receipt.id.id.slice(0, 10)}...</span>
                                <span className="font-bold text-lg text-foreground">{ (Number(receipt.amount_staked) / (10 ** 9)).toLocaleString() } {tokenSymbol}</span>
                            </div>
                            <Button variant="outline" size="sm" className="btn-sui-outline" onClick={() => onClaim(receipt.id.id)} disabled={isClaimPending}>
                                <Gift className="w-4 h-4 mr-2" />
                                Reclamar SUI
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}