// src/components/landing/MyExperiencesSection.tsx
'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { MyExperiences } from '@/components/MyExperiences';
import { Badge } from '@/components/ui/badge';

export function MyExperiencesSection() {
  const currentAccount = useCurrentAccount();

  // Si no hay una cuenta de usuario conectada, esta sección simplemente no se renderiza.
  // Esta es la lógica correcta y se mantiene.
  if (!currentAccount) {
    return null; 
  }

  // El componente MyExperiences se encarga de manejar el estado de carga y el caso de no tener activos.
  return (
    <section id="my-experiences" className="py-20 px-4 bg-muted/20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
            <Badge variant="secondary">My Collection</Badge>
            <h2 className="text-4xl md:text-5xl font-bold my-4 text-foreground text-balance">
              Your Experience Portfolio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              This is your personal command center. Manage your assets, rate past adventures, fractionalize ownership, or list experiences on the secondary market.
            </p>
        </div>
        <MyExperiences />
      </div>
    </section>
  );
}