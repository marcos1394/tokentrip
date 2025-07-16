// src/app/[locale]/auth/page.tsx
'use client';

import { useEffect } from 'react';
import { useZkLogin, ZkLoginAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
    const router = useRouter();
    const { a, b } = useZkLogin();

    // Este efecto se ejecuta cuando la página carga después de la redirección de Google.
    // El hook useZkLogin maneja automáticamente el hash de la URL para completar el login.
    useEffect(() => {
        if (a) {
            // Si hay una cuenta, el login fue exitoso. Redirigimos al dashboard o al inicio.
            router.push('/dashboard');
        }
    }, [a, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your session, please wait...</p>
        </div>
    );
}
