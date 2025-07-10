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
import { ActiveListingCard } from '@/components/dashboard/ActiveListingCard';
import { Loader, Store, BarChart2, Star, Coins, Inbox, PackageOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';


// --- Interfaces (se mantienen igual) ---
interface ProviderProfileFields {
    id: { id: string };
    active_listings: string[];
    total_reviews: string;
    total_rating_points: string;
}

// --- Sub-componentes para mejorar la legibilidad ---

function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{value}</div>
            </CardContent>
        </Card>
    );
}

function LoadingSkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[180px] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                </div>
            ))}
        </div>
    );
}


export default function DashboardPage() {
    const currentAccount = useCurrentAccount();
    const params = useParams();
    const locale = params.locale as string;
    const suiClient = useSuiClient();

    // --- Lógica de Datos (sin cambios, ya es eficiente) ---
    const { data: providerData, isLoading: isLoadingProfile, refetch: refetchProviderData } = useSuiClientQuery('getOwnedObjects', { owner: currentAccount?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` }, options: { showContent: true } }, { enabled: !!currentAccount });
    const providerProfile = providerData?.data?.[0];
    const providerProfileFields = providerProfile?.data?.content?.dataType === 'moveObject' ? providerProfile.data.content.fields as unknown as ProviderProfileFields : null;

   // 2. Usamos los IDs de `active_listings` para buscar esos objetos
    const { data: activeListings, isLoading: isLoadingActiveListings } = useQuery({
        // La queryKey es correcta
        queryKey: ['active-listings', providerProfileFields?.id.id],

        // --- CORRECCIÓN: Se implementa la lógica completa de la queryFn ---
        queryFn: async () => {
            // Si no hay perfil o no hay listings, devolvemos un array vacío.
            if (!providerProfileFields || providerProfileFields.active_listings.length === 0) {
                return [];
            }
            // Si hay IDs, los buscamos todos en una sola llamada.
            return suiClient.multiGetObjects({
                ids: providerProfileFields.active_listings,
                options: { showContent: true }
            });
        },
        
        // La condición enabled es correcta
        enabled: !!providerProfileFields,
    });

    const { data: nftsData, isLoading: isLoadingNfts, refetch: refetchNfts } = useSuiClientQuery('getOwnedObjects', { owner: currentAccount?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ExperienceNFT` }, options: { showContent: true, showDisplay: true } }, { enabled: !!currentAccount });
    const listableNfts = nftsData?.data ?? [];
    
    const handleListingSuccess = () => {
        refetchProviderData();
        refetchNfts();
    }

    // --- Renderizado Condicional Mejorado ---

    if (isLoadingProfile) {
        return <div className="flex items-center justify-center min-h-screen"><Loader className="animate-spin h-10 w-10" /></div>;
    }

    if (!providerProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-4">
                <Card className="max-w-md mx-auto glass-card p-8">
                    <CardHeader>
                        <Store className="w-12 h-12 mx-auto text-primary" />
                        <CardTitle className="text-2xl mt-4 text-foreground">Become a Provider</CardTitle>
                        <CardDescription className="mt-2 text-muted-foreground">To manage your storefront and sell experiences, you need to create a provider profile first.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" className="w-full btn-sui">
                            <Link href="/register-provider">Create Your Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // --- Cálculos de Estadísticas ---
    const totalReviews = Number(providerProfileFields?.total_reviews || 0);
    const averageRating = totalReviews > 0 ? (Number(providerProfileFields?.total_rating_points || 0) / totalReviews).toFixed(1) : "N/A";


    // --- Renderizado del Dashboard Principal ---
    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground text-balance">Provider Dashboard</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">Manage your active listings and inventory. This is your command center for the TokenTrip marketplace.</p>
                </div>

                {/* Cabecera de Estadísticas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard title="Active Listings" value={providerProfileFields?.active_listings.length ?? 0} icon={Store} />
                    <StatCard title="Total Reviews" value={totalReviews} icon={Star} />
                    <StatCard title="Average Rating" value={averageRating} icon={BarChart2} />
                    <StatCard title="Lifetime Sales (SUI)" value="Coming Soon" icon={Coins} />
                </div>

                {/* Pestañas para organizar el contenido */}
                <Tabs defaultValue="listings" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="listings">Active Listings</TabsTrigger>
                        <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="listings" className="mt-6">
                        {isLoadingActiveListings && <LoadingSkeletonGrid />}
                        {activeListings && activeListings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {activeListings.map((listing) => (
                                    listing.data && <ActiveListingCard key={listing.data.objectId} listing={listing.data as any} />
                                ))}
                            </div>
                        ) : (
                            !isLoadingActiveListings && (
                                <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                                    <PackageOpen className="w-12 h-12" />
                                    <p className="text-lg font-semibold">You have no active listings.</p>
                                    <p>List an item from your inventory below to get started!</p>
                                </div>
                            )
                        )}
                    </TabsContent>

                    <TabsContent value="inventory" className="mt-6">
                        {isLoadingNfts && <LoadingSkeletonGrid />}
                        {listableNfts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {listableNfts.map((nft) => (
                                    <ListableNftCard 
                                        key={nft.data!.objectId} 
                                        nft={nft.data as any} 
                                        providerProfileId={providerProfile.data!.objectId}
                                        onActionSuccess={handleListingSuccess}
                                    />
                                ))}
                            </div>
                        ) : (
                            !isLoadingNfts && (
                                <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                                    <Inbox className="w-12 h-12" />
                                    <p className="text-lg font-semibold">Your inventory is empty.</p>
                                    <p>Create a new experience NFT to start selling.</p>
                                </div>
                            )
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}