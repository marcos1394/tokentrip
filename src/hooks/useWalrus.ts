// src/hooks/useWalrus.ts
import { useMemo } from 'react';
import { WalrusClient } from '@mysten/walrus';
import { useSuiClient } from '@mysten/dapp-kit';

export function useWalrus() {
    const suiClient = useSuiClient();

    const walrusClient = useMemo(() => {
        return new WalrusClient({
            suiClient,
            network: 'testnet',
            // Esta es la configuración clave para usar el relay
            uploadRelay: {
                host: 'https://upload-relay.testnet.walrus.space',
                
                // --- AÑADIR ESTO ---
                // Le decimos al SDK que incluya una pequeña propina para el relay.
                // Esto es probablemente lo que faltaba.
                sendTip: {
                    // Un máximo de 1000 MIST (0.000001 SUI) es un valor muy pequeño y seguro.
                    // El SDK determinará el monto exacto necesario hasta este máximo.
                    max: 10000,
                },
            },
        });
    }, [suiClient]);

    return { walrusClient };
}