'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZkLoginState } from '@/context/ZkLoginContext';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getZkLoginSignature, jwtToAddress, getExtendedEphemeralPublicKey } from '@mysten/sui/zklogin';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCallbackPage() {
    const router = useRouter();
    const { login } = useZkLoginState();
    const [error, setError] = useState<string | null>(null);
    // --- AÑADIDO: Estado para los logs de depuración ---
    const [log, setLog] = useState<string[]>([]);

    useEffect(() => {
        const completeLogin = async () => {
            setLog(prev => [...prev, 'Auth page loaded. Starting...']);
            
            try {
                // 1. Extraer el token JWT de la URL
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const jwt_token = params.get('id_token');
                if (!jwt_token) throw new Error("JWT token not found in URL hash.");
                setLog(prev => [...prev, '✅ Step 1/8: JWT token found.']);

                // 2. Recuperar datos de localStorage
                const storedDataJSON = localStorage.getItem('zk-login-data');
                if (!storedDataJSON) throw new Error("Ephemeral data not found in storage.");
                const storedData = JSON.parse(storedDataJSON);
                if (!storedData.ephemeralKeyPair) throw new Error("Ephemeral key pair missing from storage.");
                setLog(prev => [...prev, '✅ Step 2/8: Ephemeral data retrieved.']);

                 // 1. Reconstruimos el array completo que guardamos.
                const fullKeyArray = new Uint8Array(storedData.ephemeralKeyPair);
                
                // 2. Nos quedamos solo con los primeros 32 bytes, que son la clave secreta.
                const secretKey = fullKeyArray.slice(0, 32);
                
                // 3. Creamos el keypair a partir de esos 32 bytes.
                const ephemeralKeyPair = Ed25519Keypair.fromExportedKeypair(storedData.ephemeralKeyPair);

                // 3. Reconstruir la llave efímera
                setLog(prev => [...prev, '✅ Step 3/8: Ephemeral keypair reconstructed.']);

                // 4. Obtener el "salt"
                setLog(prev => [...prev, '⏳ Step 4/8: Requesting user salt...']);
                const saltResponse = await fetch('/api/salt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jwt: jwt_token }),
                });
                if (!saltResponse.ok) throw new Error(`Salt service error: ${await saltResponse.text()}`);
                const { salt } = await saltResponse.json();
                if (!salt) throw new Error("Failed to get user salt from the server.");
                setLog(prev => [...prev, '✅ Step 4/8: Salt received.']);

                // 5. Calcular la dirección Sui
                const address = jwtToAddress(jwt_token, salt);
                setLog(prev => [...prev, `✅ Step 5/8: Sui Address generated: ${address.substring(0, 10)}...`]);
                
                // 6. Obtener la prueba ZKP
                setLog(prev => [...prev, '⏳ Step 6/8: Requesting ZK Proof...']);
                 const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
                    ephemeralKeyPair.getPublicKey()
                );

               const proofResponse = await fetch('/api/zk-proof', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jwt: jwt_token,
                        extendedEphemeralPublicKey: extendedEphemeralPublicKey, // Se usa la clave formateada
                        maxEpoch: storedData.maxEpoch,
                        jwtRandomness: storedData.randomness,
                        salt: salt, // <-- LÍNEA AÑADIDA
                        keyClaimName: "sub",
                    })
                });
                if (!proofResponse.ok) throw new Error(`ZK Proof service error: ${await proofResponse.text()}`);
                const zkProof = await proofResponse.json();
                if (!zkProof) throw new Error('Failed to get ZK Proof.');
                setLog(prev => [...prev, '✅ Step 6/8: ZK Proof received.']);

                // 7. Construir la firma final
                const userSignatureBytes = await ephemeralKeyPair.sign(new TextEncoder().encode(jwt_token));
                const userSignature = getZkLoginSignature({
                    inputs: { ...zkProof },
                    maxEpoch: storedData.maxEpoch,
                    userSignature: userSignatureBytes,
                });
                setLog(prev => [...prev, '✅ Step 7/8: Final signature constructed.']);
                
                // 8. Guardar el estado del usuario y redirigir
                login({ address, userSignature, ephemeralKeyPair });
                localStorage.removeItem('zk-login-data');
                setLog(prev => [...prev, '🚀 Step 8/8: Login successful! Redirecting...']);
                router.push('/dashboard');

            } catch (err: any) {
                setError(err.message);
                console.error("zkLogin callback error:", err);
            }
        };

        completeLogin();
    }, [router, login]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <h1 className="text-2xl font-bold mt-4">Verifying Your Session</h1>
                <p className="text-muted-foreground">Please wait, we're securely connecting your account...</p>

                <Card className="mt-8 text-left text-xs bg-muted/50">
                    <CardHeader><CardTitle>Debug Log</CardTitle></CardHeader>
                    <CardContent className="space-y-1 font-mono max-h-60 overflow-y-auto">
                        {log.map((l, i) => <p key={i}>{l}</p>)}
                        {error && <p className="text-destructive font-bold">❌ ERROR: {error}</p>}
                    </CardContent>
                </Card>
                 {error && (
                    <Button onClick={() => router.push('/')} className="mt-4">
                        Return Home
                    </Button>
                )}
            </div>
        </div>
    );
}
