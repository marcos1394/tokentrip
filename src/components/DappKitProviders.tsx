// src/components/DappKitProviders.tsx
'use client';

import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import { ZkLoginProvider } from '@/context/ZkLoginContext'; // <-- Importa nuestro nuevo proveedor

const queryClient = new QueryClient();
const { networkConfig } = createNetworkConfig({
	devnet: { url: getFullnodeUrl('devnet') }, // <-- AÑADIR ESTA LÍNEA
	testnet: { url: getFullnodeUrl('testnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
});

export default function DappKitProviders({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
				<WalletProvider autoConnect>
                    {/* Envolvemos todo con nuestro ZkLoginProvider */}
                    <ZkLoginProvider>
                        {children}
                    </ZkLoginProvider>
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
}
