'use client';

import { useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { suiConfig } from '@/config/sui';
import { SuiObjectData } from '@mysten/sui/client';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { ArrowLeft, Loader } from 'lucide-react';
import { ProviderInfoCard } from '@/components/provider/ProviderInfoCard';
import { ProviderReviews } from '@/components/provider/ProviderReviews';
import { ProviderListings } from '@/components/provider/ProviderListings';

// Interfaces
interface ProviderProfileFields {
  name: string; bio: string; image_url: { url: string };
  total_reviews: string; total_rating_points: string;
  active_listings: string[];
}
interface ReviewFields {
  provider_id: string; comment: string; rating: number; reviewer: string;
}

export default function ProviderProfilePage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const locale = params.locale as string;
  const suiClient = useSuiClient();

  // 1. Obtener los datos del Perfil del Proveedor
  const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery(
    'getObject', { id: providerId, options: { showContent: true } }, { enabled: !!providerId }
  );

  const profile = providerData?.data?.content?.dataType === 'moveObject' ? providerData.data.content.fields as unknown as ProviderProfileFields : null;

  // 2. Obtener los detalles de los Listings Activos
  const { data: activeListings, isLoading: isLoadingListings } = useQuery({
    queryKey: ['provider-active-listings', providerId],
    queryFn: async (): Promise<SuiObjectData[]> => {
        if (!profile || profile.active_listings.length === 0) {
            return [];
        }
        const response = await suiClient.multiGetObjects({ 
            ids: profile.active_listings, 
            options: { showContent: true } 
        });
        
        return response
            .filter(obj => obj.data)
            .map(obj => obj.data!);
    },
    enabled: !!profile,
  });

  // 3. Obtener las reseñas del Proveedor
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: async () => {
        const eventResponse = await suiClient.queryEvents({ query: { MoveEventType: `${suiConfig.packageId}::experience_nft::ReviewAdded` } });
        const providerReviews = eventResponse.data
            .map(event => event.parsedJson as any)
            .filter(review => review && review.provider_id === providerId);
        return providerReviews as ReviewFields[];
    },
    enabled: !!providerId,
  });

  // --- RENDERIZADO ---

  if (isLoadingProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
  }

  // Se verifica PRIMERO si el perfil existe. Si no, se muestra un error.
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Perfil de proveedor no encontrado.</div>;
  }
  
  // --- CORRECCIÓN: Todos los cálculos se hacen DESPUÉS de la verificación ---
  // En este punto, TypeScript sabe que `profile` no es nulo y es seguro de usar.
  const totalReviews = Number(profile.total_reviews);
  const totalRatingPoints = Number(profile.total_rating_points);
  const averageRating = totalReviews > 0 ? totalRatingPoints / totalReviews : 0;


  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <AnimatedBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-8">
            <Button asChild variant="outline" className="glass-card">
                <Link href={`/${locale}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Marketplace
                </Link>
            </Button>
        </div>

        <ProviderInfoCard
            name={profile.name}
            bio={profile.bio}
            imageUrl={profile.image_url.url}
            averageRating={averageRating}
            totalReviews={totalReviews}
        />
        
        <div className="mt-12 space-y-12">
            <ProviderListings listings={activeListings ?? []} isLoading={isLoadingListings} />
            <ProviderReviews reviews={reviews ?? []} isLoading={isLoadingReviews} />
        </div>
      </div>
      <Toaster />
    </div>
  );
}