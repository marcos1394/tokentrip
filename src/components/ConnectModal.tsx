'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useZkLogin, ZkLoginProvider } from '@mysten/dapp-kit';
import { Wallets } from '@mysten/dapp-kit';
import { Chrome, Twitch, Facebook, Loader2 } from 'lucide-react';

// Sub-componente para los botones de redes sociales para mantener el código limpio
function SocialLoginButton({
  provider,
  label,
  icon: Icon,
  onSelect,
  isPending,
}: {
  provider: ZkLoginProvider;
  label: string;
  icon: React.ElementType;
  onSelect: () => void;
  isPending: boolean;
}) {
  return (
    <Button
      className="w-full justify-center gap-3"
      variant="outline"
      onClick={onSelect}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-5 w-5" />
      )}
      {label}
    </Button>
  );
}


export function ConnectModal() {
  const { beginZkLogin, isPending } = useZkLogin({
    // onSuccess se llama después de que el usuario vuelve de Google/Twitch, etc.
    onSuccess: (data) => {
        console.log('OAuth success:', data);
        // TODO: Enviar 'data' a tu backend para generar la prueba ZK.
        // Tu backend llamará al Prover de Mysten y te devolverá los datos necesarios
        // para la transacción final del inicio de sesión.
        // Ver: https://docs.sui.io/concepts/cryptography/zklogin/zklogin-e2e-tutorial
    }
  });
  
  // Estado para saber qué proveedor se está procesando
  const [pendingProvider, setPendingProvider] = useState<ZkLoginProvider | null>(null);

  const handleLogin = (provider: ZkLoginProvider) => {
    setPendingProvider(provider);
    beginZkLogin({ provider });
  };

  return (
    <Dialog onOpenChange={() => setPendingProvider(null)}>
      <DialogTrigger asChild>
        <Button className="btn-sui">Sign In / Connect</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-effect">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Join TokenTrip</DialogTitle>
          <DialogDescription className="text-center">
            Sign in with your social account or connect a wallet to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {/* Opciones de zkLogin */}
          <div className="space-y-3">
            <SocialLoginButton
              provider="google"
              label="Sign In with Google"
              icon={Chrome}
              onSelect={() => handleLogin('google')}
              isPending={isPending && pendingProvider === 'google'}
            />
            <SocialLoginButton
              provider="twitch"
              label="Sign In with Twitch"
              icon={Twitch}
              onSelect={() => handleLogin('twitch')}
              isPending={isPending && pendingProvider === 'twitch'}
            />
             <SocialLoginButton
              provider="facebook"
              label="Sign In with Facebook"
              icon={Facebook}
              onSelect={() => handleLogin('facebook')}
              isPending={isPending && pendingProvider === 'facebook'}
            />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                For advanced users
              </span>
            </div>
          </div>

          {/* Selector de Billeteras Tradicionales */}
          <div className="max-h-[200px] overflow-y-auto px-1">
            <Wallets />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}