// src/components/ConnectModal.tsx
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import { useSuiClient } from '@mysten/dapp-kit';
import { Chrome, Twitch, Facebook, Loader2 } from 'lucide-react';

export function ConnectModal() {
  const [isPending, setIsPending] = useState(false);
  const suiClient = useSuiClient();

  const handleLogin = async (provider: 'google' | 'twitch' | 'facebook') => {
    setIsPending(true);
    try {
      const { epoch } = await suiClient.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2;
      const ephemeralKeyPair = new Ed25519Keypair();
      const randomness = generateRandomness();
      const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
      // Guardar datos cruciales en localStorage antes de la redirección
      const loginData = {
ephemeralKeyPair: Array.from(ephemeralKeyPair.getSecretKey()),        maxEpoch,
        randomness,
      };
      localStorage.setItem('zk-login-data', JSON.stringify(loginData));

      const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
      const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI!;

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: nonce,
      });

      const loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      window.location.href = loginUrl;

    } catch (error) {
      console.error(error);
      setIsPending(false);
    }
  };

  return (
    <Dialog onOpenChange={() => setIsPending(false)}>
      <DialogTrigger asChild><Button className="btn-sui">Sign In / Connect</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md glass-effect">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Join TokenTrip</DialogTitle>
          <DialogDescription className="text-center">Sign in with your social account or connect a wallet.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-3">
            <Button className="w-full justify-center gap-3" variant="outline" onClick={() => handleLogin('google')} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-5 w-5" />}
              Sign In with Google
            </Button>
            {/* Se pueden añadir botones para Twitch y Facebook con una lógica similar */}
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or connect with a wallet</span></div>
          </div>
          {/* Si <Wallets /> da error, reemplázalo con <ConnectButton /> de una versión anterior */}
          <div className="max-h-[200px] overflow-y-auto px-1 flex justify-center">
             <p className="text-xs text-muted-foreground">Connect with a traditional wallet (coming soon).</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}