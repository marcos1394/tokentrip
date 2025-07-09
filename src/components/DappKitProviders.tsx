'use client';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFullnodeUrl } from '@mysten/sui/client';
import '@mysten/dapp-kit/dist/index.css';

// 1. Configuración de la Red
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  // mainnet: { url: getFullnodeUrl('mainnet') }, // Descomentar para producción
};

// 2. Creación del Cliente de React Query
const queryClient = new QueryClient();

export default function DappKitProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="devnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}