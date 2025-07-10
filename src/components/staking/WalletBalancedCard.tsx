// Se ha eliminado 'use client' porque este componente no tiene interactividad propia.
// Ahora es un Componente de Servidor más rápido que solo muestra los datos que recibe.
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
    <Card className="glass-card card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Your Wallet Balance
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-foreground">
              {balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total {tokenSymbol} available in your wallet.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}