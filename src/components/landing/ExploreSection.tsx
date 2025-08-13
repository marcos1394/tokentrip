'use client';

import { useGetListings } from "@/hooks/useGetListings";
import { ExperienceNftCard } from "@/components/ExperienceNftCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageOpen, AlertTriangle } from "lucide-react";

// --- Sub-componente para el estado de carga (sin cambios) ---
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                    <div className="space-y-2 p-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-8 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ExploreSection() {
    const { data: listings, isLoading, isError } = useGetListings();

    return (
        <section id="explore" className="py-20 px-4">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <Badge variant="secondary">Live Marketplace</Badge>
                    <h2 className="text-4xl md:text-5xl font-bold my-4 text-foreground text-balance">
                        Discover Unique Experiences
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                        Browse our curated collection of tokenized adventures, tickets, and one-of-a-kind activities from verified providers around the globe.
                    </p>
                </div>
                
                <div>
                    {isLoading && <LoadingSkeleton />}

                    {isError && 
                        <div className="text-center py-16 text-destructive flex flex-col items-center gap-4 border-2 border-dashed border-destructive/50 rounded-lg">
                            <AlertTriangle className="w-12 h-12" />
                            <p className="text-lg font-semibold">Failed to Load Experiences</p>
                            <p className="text-muted-foreground">There was an error connecting to the network. Please refresh the page.</p>
                        </div>
                    }

                    {!isLoading && !isError && listings && listings.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {listings.map((listing) => (
                                <ExperienceNftCard 
                                    key={listing.listingId}
                                    listingId={listing.listingId}
                                    nftId={listing.nft.id}
                                    name={listing.nft.name}
                                    imageUrl={listing.nft.imageUrl}
                                    contentType={listing.nft.contentType} // <-- CAMBIO CLAVE AQUÍ
                                    price={listing.price}
                                    currency={listing.currency}
                                />
                            ))}
                        </div>
                    )}

                    {!isLoading && !isError && (!listings || listings.length === 0) && (
                        <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                            <PackageOpen className="w-12 h-12" />
                            <p className="text-lg font-semibold">The Marketplace is Quiet Right Now</p>
                            <p>No experiences are currently listed for sale. Check back soon!</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
