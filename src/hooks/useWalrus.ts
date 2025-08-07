// src/hooks/useWalrus.ts
import { useMemo, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { useSuiClient, useCurrentWallet } from '@mysten/dapp-kit';

export function useWalrus() {
    const suiClient = useSuiClient();
    const { currentWallet, connectionStatus } = useCurrentWallet();

    // El código de diagnóstico sigue siendo útil, lo dejamos.
    useEffect(() => {
        console.log('--- [DIAGNÓSTICO DE WALLET] ---');
        console.log('Estado de Conexión:', connectionStatus);
        console.log('Objeto currentWallet Completo:', currentWallet);
        if (currentWallet) {
            console.log('Cadenas Soportadas por la Wallet:', currentWallet.chains);
            console.log('Cuenta Activa:', currentWallet.accounts[0]);
            console.log('Cadena ACTIVA de la Cuenta:', currentWallet.accounts[0]?.chains);
        }
        console.log('---------------------------------');
    }, [currentWallet, connectionStatus]);

    const walrusClient = useMemo(() => {
        if (!suiClient || !currentWallet) {
            return null;
        }

        // --- CORRECCIÓN CLAVE ---
        // 1. Obtenemos la cuenta que está actualmente activa.
        const currentAccount = currentWallet.accounts?.[0];
        if (!currentAccount) {
            return null; // Aún no hay una cuenta activa
        }

        // 2. Obtenemos la cadena desde la CUENTA, no desde la wallet.
        const activeChain = currentAccount.chains?.[0];
        
        // 3. La guarda de red ahora funcionará con la cadena correcta.
        if (activeChain !== 'sui:testnet' && activeChain !== 'sui:mainnet') {
            if (activeChain) {
                console.warn(`[Walrus] Red activa no soportada: ${activeChain}. El cliente no será inicializado.`);
            }
            return null;
        }

        console.log(`[Walrus] Red activa y soportada detectada: ${activeChain}. Inicializando cliente.`);
        
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
