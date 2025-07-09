'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet } from 'lucide-react';

interface WalletBalanceCardProps {
  balance: number;
  isLoading: boolean;
  tokenSymbol: string;
}

export function WalletBalanceCard({
  balance,
  isLoading,
  tokenSymbol,
}: WalletBalanceCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Balance en tu Billetera
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="mt-1 h-4 w-1/2" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-foreground">
              {/* Formatea el número para incluir comas como separadores de miles */}
              {balance.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de {tokenSymbol} disponibles para usar.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}