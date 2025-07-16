'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZkLoginState } from '@/context/ZkLoginContext';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getZkLoginSignature, jwtToAddress } from '@mysten/sui/zklogin';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSuiClient } from '@mysten/dapp-kit';

export default function AuthCallbackPage() {
    const router = useRouter();
    const { login } = useZkLoginState();
    const [error, setError] = useState<string | null>(null);
    const suiClient = useSuiClient();

    useEffect(() => {
        // Esta función se ejecuta tan pronto como la página carga.
        async function completeLogin() {
            try {
                // 1. Extraer el token JWT de la URL
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const jwt_token = params.get('id_token');
                if (!jwt_token) {
                    throw new Error("JWT token not found in URL hash.");
                }

                // 2. Recuperar los datos temporales de localStorage
                const storedData = JSON.parse(localStorage.getItem('zk-login-data') || '{}');
                if (!storedData.ephemeralKeyPair || !storedData.maxEpoch || !storedData.randomness) {
                    throw new Error("Ephemeral data not found in storage. Please try logging in again.");
                }

                // 3. Reconstruir la llave efímera
                const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(new Uint8Array(storedData.ephemeralKeyPair));

                // 4. Obtener el "salt" del usuario desde nuestro backend
                // Esto es crucial para la seguridad y para que la dirección Sui sea siempre la misma para el mismo usuario.
                const saltResponse = await fetch('/api/salt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt: jwt_token }),
                });
                const { salt } = await saltResponse.json();
                if (!salt) {
                    throw new Error("Failed to get user salt from the server.");
                }

                // 5. Calcular la dirección Sui del usuario
                const address = jwtToAddress(jwt_token, salt);
                
                // 6. Obtener la prueba de conocimiento cero (ZKP) desde nuestro backend
                const proofResponse = await fetch('/api/zk-proof', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jwt: jwt_token,
                        extendedEphemeralPublicKey: ephemeralKeyPair.getPublicKey().toSuiPublicKey(),
                        maxEpoch: storedData.maxEpoch,
                        jwtRandomness: storedData.randomness,
                        keyClaimName: "sub",
                    })
                });
                const zkProof = await proofResponse.json();
                if (!zkProof || zkProof.error) {
                    throw new Error(`Failed to get ZK Proof: ${zkProof.details || 'Unknown error'}`);
                }

                // 7. Construir la firma final de zkLogin
                const userSignature = getZkLoginSignature({
                    inputs: { ...zkProof },
                    maxEpoch: storedData.maxEpoch,
                    userSignature: ephemeralKeyPair.sign(new TextEncoder().encode(jwt_token)),
                });

                // 8. Guardar el estado del usuario en nuestro Context y limpiar
                login({
                    address,
                    userSignature: userSignature,
                    ephemeralKeyPair: ephemeralKeyPair,
                });
                localStorage.removeItem('zk-login-data');
                router.push('/dashboard'); // O a donde quieras redirigir

            } catch (err: any) {
                setError(err.message);
                console.error("zkLogin callback error:", err);
            }
        }

        completeLogin();
    }, [router, login, suiClient]);

    // UI para mostrar mientras se procesa o si hay un error
    if (error) {
        return (
            <div className="min-h-screen text-center flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-destructive">Login Failed</h1>
                <p className="text-muted-foreground mt-2">{error}</p>
                <Button onClick={() => router.push('/')} className="mt-4">
                    Go Home
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your session, please wait...</p>
        </div>
    );
}
