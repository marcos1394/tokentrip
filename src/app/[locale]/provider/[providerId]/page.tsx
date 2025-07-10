// app/[locale]/provider/[providerId]/page.tsx
'use client';

import { useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { suiConfig } from '@/config/sui';
import type { SuiObjectData, SuiEvent, EventId } from '@mysten/sui/client';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { ArrowLeft, Loader, PackageOpen, MessageSquare } from 'lucide-react';
import { ProviderInfoCard } from '@/components/provider/ProviderInfoCard';
import { ProviderReviews } from '@/components/provider/ProviderReviews';
import { ProviderListings } from '@/components/provider/ProviderListings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
    const suiClient = useSuiClient();

    // 1. Obtener los datos del Perfil del Proveedor (se mantiene igual)
    const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery(
        'getObject', { id: providerId, options: { showContent: true } }, { enabled: !!providerId }
    );
    const profile = providerData?.data?.content?.dataType === 'moveObject' ? providerData.data.content.fields as unknown as ProviderProfileFields : null;

    // 2. Obtener Listings con Paginación (Scroll Infinito)
    const { 
        data: listingsPages, 
        fetchNextPage: fetchNextListings, 
        hasNextPage: hasNextListings, 
        isFetchingNextPage: isFetchingNextListings,
        isLoading: isLoadingListings
    } = useInfiniteQuery({
        queryKey: ['provider-listings', providerId],
        queryFn: async ({ pageParam = 0 }): Promise<{ data: SuiObjectData[] }> => {
            if (!profile) return { data: [] };
            const listingIds = profile.active_listings;
            const BATCH_SIZE = 8;
            const idsToFetch = listingIds.slice(pageParam, pageParam + BATCH_SIZE);

            if (idsToFetch.length === 0) return { data: [] };

            const response = await suiClient.multiGetObjects({ 
                ids: idsToFetch, 
                options: { showContent: true, showDisplay: true } 
            });
            return { data: response.filter(obj => obj.data).map(obj => obj.data!) };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.flatMap(p => p.data).length;
            return totalFetched < (profile?.active_listings.length ?? 0) ? totalFetched : undefined;
        },
        enabled: !!profile,
    });
    const activeListings = listingsPages?.pages.flatMap(page => page.data) ?? [];

    // 3. Obtener Reseñas con Paginación y Filtro Eficiente
    const { 
        data: reviewsPages, 
        fetchNextPage: fetchNextReviews, 
        hasNextPage: hasNextReviews, 
        isFetchingNextPage: isFetchingNextReviews,
        isLoading: isLoadingReviews
    } = useInfiniteQuery({
        queryKey: ['provider-reviews', providerId],
        queryFn: async ({ pageParam = null }: { pageParam?: EventId | null }): Promise<{data: ReviewFields[], nextCursor: EventId | null}> => {
            const eventResponse = await suiClient.queryEvents({ 
                   query: { 
                    MoveEventType: `${suiConfig.packageId}::experience_nft::ReviewAdded`,
                },
                limit: 50, // Pedimos un lote más grande
                cursor: pageParam
            });

            // 2. Filtramos los resultados en el cliente
            const providerReviews = eventResponse.data
                .map(event => event.parsedJson as ReviewFields)
                .filter(review => review && review.provider_id === providerId);
            
            return { 
                data: providerReviews, 
                nextCursor: eventResponse.nextCursor ?? null 
            };
        },
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!providerId,
    });
    const reviews = reviewsPages?.pages.flatMap(page => page.data) ?? [];

    // Renderizado
    if (isLoadingProfile) {
        return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10" /></div>;
    }

    if (!profile) {
        return <div className="min-h-screen flex items-center justify-center">Provider profile not found.</div>;
    }
    
    const totalReviews = BigInt(profile.total_reviews);
    const totalRatingPoints = BigInt(profile.total_rating_points);
    const averageRating = totalReviews > 0n ? Number(totalRatingPoints) / Number(totalReviews) : 0;

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace</Link>
                    </Button>
                </div>

                <ProviderInfoCard
                    name={profile.name}
                    bio={profile.bio}
                    imageUrl={profile.image_url.url}
                    averageRating={averageRating}
                    totalReviews={Number(totalReviews)}
                    isLoading={isLoadingProfile}
                />
                
                <Tabs defaultValue="listings" className="w-full mt-12">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="listings">Active Listings</TabsTrigger>
                        <TabsTrigger value="reviews">Community Reviews</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="listings" className="mt-6">
                        <ProviderListings listings={activeListings} isLoading={isLoadingListings} />
                        {hasNextListings && (
                            <div className="text-center mt-8">
                                <Button onClick={() => fetchNextListings()} disabled={isFetchingNextListings} variant="outline" className="glass-card">
                                    {isFetchingNextListings ? <Loader className="animate-spin w-5 h-5 mr-2" /> : null}
                                    {isFetchingNextListings ? 'Loading...' : 'Load More Listings'}
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-6">
                        <ProviderReviews reviews={reviews} isLoading={isLoadingReviews} />
                         {hasNextReviews && (
                            <div className="text-center mt-8">
                                <Button onClick={() => fetchNextReviews()} disabled={isFetchingNextReviews} variant="outline" className="glass-card">
                                    {isFetchingNextReviews ? <Loader className="animate-spin w-5 h-5 mr-2" /> : null}
                                    {isFetchingNextReviews ? 'Loading...' : 'Load More Reviews'}
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
            <Toaster />
        </div>
    );
}