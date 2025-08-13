// src/components/provider/ProviderListings.tsx

import { SuiObjectData } from "@mysten/sui/client";
import { ExperienceNftCard } from "@/components/ExperienceNftCard";
import { PackageOpen, Sailboat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// --- INTERFACES ALINEADAS CON LA NUEVA ESTRUCTURA DEL CONTRATO ---
interface Attribute {
  fields: {
    key: string;
    value: string;
  }
}
interface NftFields {
  id: { id: string };
  image_blob_object_id: string; 
  name: string;
  attributes: Attribute[];
  // Se pueden añadir más campos si se necesitan
}
interface ListingFields {
  nft: { fields: NftFields };
  price: string;
  is_tkt_listing: boolean;
}

// --- Sub-componente para el estado de carga (sin cambios) ---
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
interface ProviderListingsProps {
    listings: SuiObjectData[];
    isLoading: boolean;
}

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
                    if (!fields || !fields.nft?.fields) return null;
                    
                    // --- LÓGICA DE EXTRACCIÓN DE DATOS ACTUALIZADA ---
                    const nftFields = fields.nft.fields;
                    
                    const imageBlobObjectId = nftFields.image_blob_object_id;
                    const finalImageUrl = imageBlobObjectId 
                        ? `https://aggregator.testnet.walrus.atalma.io/v1/blobs/by-object-id/${imageBlobObjectId}`
                        : '';

                    const contentTypeAttr = nftFields.attributes?.find(
                        (attr: any) => attr.fields.key === 'content-type'
                    );
                    const contentType = contentTypeAttr ? contentTypeAttr.fields.value : 'application/octet-stream';
                    
                    const currency = fields.is_tkt_listing ? "TKT" : "SUI";
                    
                    return (
                        <ExperienceNftCard
                            key={listing.objectId}
                            listingId={listing.objectId}
                            nftId={nftFields.id.id}
                            name={nftFields.name}
                            imageUrl={finalImageUrl}
                            contentType={contentType} // <-- Se pasa el contentType
                            price={Number(fields.price) / 1_000_000_000}
                            currency={currency}
                        />
                    )
                })}
            </div>
        </section>
    );
}
