// src/hooks/useWalrus.ts
import { useMemo } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { useSuiClient, useCurrentWallet } from '@mysten/dapp-kit';

export function useWalrus() {
    const suiClient = useSuiClient();
    // 1. Obtenemos el objeto `currentWallet` completo.
    const { currentWallet } = useCurrentWallet();

    const walrusClient = useMemo(() => {
        // 2. Verificamos que tanto el cliente como la wallet estén listos.
        // Si `currentWallet` es null, significa que aún no estamos conectados.
        if (!suiClient || !currentWallet) {
            return null;
        }

        // 3. Ahora que sabemos que `currentWallet` existe, podemos acceder a `chains` de forma segura.
        const currentChain = currentWallet.chains?.[0];
        
        // La guarda de red que ya teníamos.
        if (currentChain !== 'sui:testnet' && currentChain !== 'sui:mainnet') {
            if (currentChain) {
                console.warn(`[Walrus] Red no soportada: ${currentChain}. El cliente no será inicializado.`);
            }
            return null;
        }

        // Si todo está bien, inicializamos el cliente.
        const clientWithWalrus = suiClient.$extend(
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

    }, [suiClient, currentWallet]); // 4. Actualizamos la dependencia a `currentWallet`.

    return { walrusClient };
}