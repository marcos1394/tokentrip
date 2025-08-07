// src/hooks/useWalrus.ts
import { useMemo, useEffect } from 'react';
// IMPORTANTE: Importamos SuiClient y getFullnodeUrl directamente desde @mysten/sui/client
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
// Ya no necesitamos useSuiClient aquí
import { useCurrentWallet } from '@mysten/dapp-kit';

export function useWalrus() {
    const { currentWallet, connectionStatus } = useCurrentWallet();

    const walrusClient = useMemo(() => {
        if (!currentWallet) {
            return null;
        }

        const currentAccount = currentWallet.accounts?.[0];
        if (!currentAccount) {
            return null;
        }

        const activeChain = currentAccount.chains?.[0];
        
        if (activeChain !== 'sui:testnet' && activeChain !== 'sui:mainnet') {
            if (activeChain) {
                console.warn(`[Walrus] Red activa no soportada: ${activeChain}.`);
            }
            return null;
        }

        // --- SOLUCIÓN FINAL ---
        // 1. Extraemos el nombre de la red ('testnet' o 'mainnet').
        const networkName = activeChain.slice(4) as 'testnet' | 'mainnet';
        
        // 2. Obtenemos la URL del RPC para esa red.
        const rpcUrl = getFullnodeUrl(networkName);
        
        console.log(`[Walrus] Creando un nuevo cliente para la red: ${networkName}`);

        // 3. Creamos una instancia de SuiClient FRESCA y la extendemos.
        // Esto elimina cualquier desincronización.
        const clientWithWalrus = new SuiClient({ url: rpcUrl }).$extend(
            WalrusClient.experimental_asClientExtension({
                uploadRelay: {
                    host: 'https://upload-relay.testnet.walrus.space',
                    sendTip: {
                        max: 1000,
                    },
                },
            })
        );

        return clientWithWalrus;

    }, [currentWallet]); // La única dependencia es el estado de la wallet.

    return { walrusClient };
}
