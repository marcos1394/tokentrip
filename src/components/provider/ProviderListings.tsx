// src/components/provider/ProviderListings.tsx

// Se ha eliminado 'use client', convirtiéndolo en un Componente de Servidor más rápido.
import { SuiObjectData } from "@mysten/sui/client";
import { ExperienceNftCard } from "@/components/ExperienceNftCard";
import { PackageOpen, Sailboat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// --- Interfaces y Sub-componentes ---

interface ListingFields {
    id: { id: string };
    nft: { fields: { id: { id: string }, name: string, image_url: { url: string }}};
    price: string;
    is_tkt_listing: boolean; // Se añade para determinar la moneda
}

interface ProviderListingsProps {
    listings: SuiObjectData[];
    isLoading: boolean;
}

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
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

// --- Componente Principal ---

export function ProviderListings({ listings, isLoading }: ProviderListingsProps) {
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!listings || listings.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                <PackageOpen className="w-12 h-12" />
                <p className="text-lg font-semibold">No Active Listings</p>
                <p>This provider currently has no experiences for sale.</p>
            </div>
        );
    }
    
    return (
        <section>
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-6">
                <Sailboat />
                Experiences for Sale
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map(listing => {
                    if (listing.content?.dataType !== 'moveObject') return null;

                    const fields = listing.content.fields as unknown as ListingFields;
                    if (!fields) return null;
                    
                    const currency = fields.is_tkt_listing ? "TKT" : "SUI";
                    
                    return (
                        <ExperienceNftCard
                            key={listing.objectId}
                            listingId={listing.objectId}
                            nftId={fields.nft.fields.id.id}
                            name={fields.nft.fields.name}
                            imageUrl={fields.nft.fields.image_url.url}
                            price={Number(fields.price) / 1_000_000_000}
                            currency={currency}
                        />
                    )
                })}
            </div>
        </section>
    );
}