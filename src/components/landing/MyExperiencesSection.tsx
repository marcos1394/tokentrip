// src/components/landing/MyExperiencesSection.tsx
'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { MyExperiences } from '@/components/MyExperiences';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export function MyExperiencesSection() {
  const { t } = useTranslation();
  const currentAccount = useCurrentAccount();

  // Si no hay una cuenta de usuario conectada, esta sección simplemente no se renderiza.
  if (!currentAccount) {
    return null; 
  }

  // El componente MyExperiences internamente maneja el caso de no tener activos,
  // por lo que no necesitamos una doble verificación aquí.
  return (
    <section id="mis-experiencias" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
            <Badge variant="secondary">Mi Colección</Badge>
            <h2 className="text-4xl md:text-5xl font-bold my-4 text-foreground text-balance">
                Mis Activos Digitales
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                Aquí puedes gestionar tus activos: califica compras pasadas, fracciona la propiedad de un NFT o ponlo en reventa en el mercado secundario.
            </p>
        </div>
        <MyExperiences />
      </div>
    </section>
  );
}