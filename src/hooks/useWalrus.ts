// src/hooks/useWalrus.ts
import { useMemo } from 'react';
import { WalrusClient } from '@mysten/walrus';
import { useSuiClient } from '@mysten/dapp-kit';

export function useWalrus() {
    const suiClient = useSuiClient();

    // Usamos useMemo para que el cliente no se recree en cada render
    const walrusClient = useMemo(() => {
        return new WalrusClient({
            suiClient,
            network: 'testnet',
            // Esta es la configuración clave para usar el relay
            uploadRelay: {
                host: 'https://upload-relay.testnet.walrus.space',
            },
        });
    }, [suiClient]);

    return { walrusClient };
}