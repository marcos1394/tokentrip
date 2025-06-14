'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { Badge } from '@/components/ui/badge';
import { MyFractions } from '@/components/MyFractions';

export function MyFractionsSection() {
  const currentAccount = useCurrentAccount();

  // Si no hay una cuenta conectada, esta sección no se renderiza.
  if (!currentAccount) {
    return null; 
  }

  // El componente MyFractions internamente devuelve null si no hay fracciones,
  // por lo que no necesitamos una doble verificación aquí.
  return (
    <section id="mis-fracciones" className="py-20 px-4 bg-slate-100/50 dark:bg-slate-800/20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
            <Badge variant="secondary">Mi Portafolio</Badge>
            <h2 className="text-4xl md:text-5xl font-bold my-4 text-foreground text-balance">
                Mis Fracciones
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                Estas son las partes de experiencias que posees. Puedes intercambiarlas o agruparlas para redimir la experiencia completa.
            </p>
        </div>
        <MyFractions />
      </div>
    </section>
  );
}