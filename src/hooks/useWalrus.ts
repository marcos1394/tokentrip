// src/hooks/useWalrus.ts
import { useMemo, useEffect } from 'react'; // <-- Importa useEffect
import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { useSuiClient, useCurrentWallet } from '@mysten/dapp-kit';

export function useWalrus() {
    const suiClient = useSuiClient();
    const { currentWallet, connectionStatus } = useCurrentWallet();

    // --- INICIA CÓDIGO DE DIAGNÓSTICO ---
    // Este bloque se ejecutará cada vez que el estado de la wallet cambie.
    useEffect(() => {
        console.log('--- [DIAGNÓSTICO DE WALLET] ---');
        console.log('Estado de Conexión:', connectionStatus);
        console.log('Objeto currentWallet Completo:', currentWallet);
        
        if (currentWallet) {
            console.log('Array de Redes Reportado (chains):', currentWallet.chains);
        } else {
            console.log('No hay una wallet conectada actualmente.');
        }
        console.log('---------------------------------');
    }, [currentWallet, connectionStatus]);
    // --- FIN CÓDIGO DE DIAGNÓSTICO ---


    const walrusClient = useMemo(() => {
        if (!suiClient || !currentWallet) {
            return null;
        }

        const currentChain = currentWallet.chains?.[0];
        
        if (currentChain !== 'sui:testnet' && currentChain !== 'sui:mainnet') {
            if (currentChain) {
                console.warn(`[Walrus] Red no soportada: ${currentChain}. El cliente no será inicializado.`);
            }
            return null;
        }

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

    }, [suiClient, currentWallet]);

    return { walrusClient };
}
