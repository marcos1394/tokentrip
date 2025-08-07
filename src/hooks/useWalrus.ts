// src/hooks/useWalrus.ts
import { useMemo } from 'react';
import { WalrusClient } from '@mysten/walrus';
import { useSuiClient } from '@mysten/dapp-kit';

export function useWalrus() {
    // 1. Obtenemos el cliente de Sui. Ya está configurado para la red activa.
    const suiClient = useSuiClient();

    const walrusClient = useMemo(() => {
        // 2. Si el cliente aún no está listo, no hacemos nada.
        if (!suiClient) {
            return null;
        }

        // 3. Extendemos directamente el cliente que nos da el hook.
        // Esta es la forma correcta y simple.
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

    }, [suiClient]); // La única dependencia es el suiClient.

    return { walrusClient };
}