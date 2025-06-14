// app/[locale]/dashboard/page.tsx
'use client';

import { useCurrentAccount, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { suiConfig } from '@/config/sui';
import { useQuery } from '@tanstack/react-query';

// Componentes
import { AnimatedBackground } from '@/components/animated-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListableNftCard } from '@/components/ListableNftCard';
import { ActiveListingCard } from '@/components/dashboard/ActiveListingCard'; // <-- NUEVO
import { Loader, Store } from 'lucide-react';

interface ProviderProfileFields {
    id: { id: string };
    active_listings: string[];
}

export default function DashboardPage() {
  const currentAccount = useCurrentAccount();
  const params = useParams();
  const locale = params.locale as string;
  const suiClient = useSuiClient();

  // 1. Buscamos el Perfil de Proveedor del usuario actual
  const { data: providerData, isLoading: isLoadingProfile, refetch: refetchProviderData } = useSuiClientQuery(
    'getOwnedObjects',
    { owner: currentAccount?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` }, options: { showContent: true } },
    { enabled: !!currentAccount }
  );

  const providerProfile = providerData?.data?.[0];
  const providerProfileFields = providerProfile?.data?.content?.dataType === 'moveObject' ? providerProfile.data.content.fields as unknown as ProviderProfileFields : null;

  // 2. Usamos los IDs de `active_listings` para buscar esos objetos
  const { data: activeListings, isLoading: isLoadingActiveListings } = useQuery({
    queryKey: ['active-listings', providerProfileFields?.id.id],
    queryFn: async () => {
        if (!providerProfileFields || providerProfileFields.active_listings.length === 0) {
            return [];
        }
        return suiClient.multiGetObjects({
            ids: providerProfileFields.active_listings,
            options: { showContent: true }
        });
    },
    enabled: !!providerProfileFields,
  });

  // 3. Buscamos los NFTs que el usuario posee y que puede listar
  const { data: nftsData, isLoading: isLoadingNfts, refetch: refetchNfts } = useSuiClientQuery(
    'getOwnedObjects',
    { owner: currentAccount?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ExperienceNFT` }, options: { showContent: true, showDisplay: true } },
    { enabled: !!currentAccount }
  );

  const listableNfts = nftsData?.data ?? [];
  
  const handleListingSuccess = () => {
    refetchProviderData();
    refetchNfts();
  }

  if (isLoadingProfile) {
    return <div className="flex items-center justify-center min-h-screen"><Loader className="animate-spin" /></div>;
  }

  if (!providerProfile) {
    return (
        <div className="min-h-screen flex items-center justify-center text-center">
            <Card className="max-w-md mx-auto glass-card p-8">
                <CardHeader>
                    <Store className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle className="text-2xl mt-4 text-foreground">No eres un proveedor</CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">Para gestionar y vender experiencias, primero debes crear tu perfil.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild size="lg" className="w-full btn-sui">
                        <Link href={`/${locale}/register-provider`}>Crear Perfil Ahora</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <AnimatedBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground text-balance">Dashboard de Proveedor</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">Gestiona tus experiencias y ponlas a la venta para todo el mundo.</p>
        </div>

        <div className="space-y-12">
            {/* NUEVO: Sección para Listings Activos */}
            <section>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Tus Artículos en el Mercado</h3>
                {isLoadingActiveListings && <p className="text-muted-foreground">Cargando...</p>}
                {activeListings && activeListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeListings.map((listing) => (
                            listing.data && <ActiveListingCard key={listing.data.objectId} listing={listing.data as any} />
                        ))}
                    </div>
                ) : (
                    !isLoadingActiveListings && <p className="text-muted-foreground p-8 text-center border-2 border-dashed rounded-lg">No tienes ninguna experiencia a la venta.</p>
                )}
            </section>

            <section>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Tus Experiencias para Listar</h3>
                {isLoadingNfts && <p className="text-muted-foreground">Cargando...</p>}
                {listableNfts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listableNfts.map((nft) => (
                            <ListableNftCard 
                                key={nft.data!.objectId} 
                                nft={nft.data as any} 
                                providerProfileId={providerProfile.data!.objectId}
                                onListingSuccess={handleListingSuccess}
                            />
                        ))}
                    </div>
                ) : (
                    !isLoadingNfts && <p className="text-muted-foreground p-8 text-center border-2 border-dashed rounded-lg">No tienes NFTs en tu billetera para listar.</p>
                )}
            </section>
        </div>
      </div>
    </div>
  );
}