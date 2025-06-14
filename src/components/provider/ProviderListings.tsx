'use client';

import { SuiObjectData } from "@mysten/sui/client";
import { ExperienceNftCard } from "@/components/ExperienceNftCard";
import { Loader, Sailboat } from "lucide-react";
import { useParams } from "next/navigation";

// Interfaz para los campos que esperamos
interface ListingFields {
  id: { id: string };
  nft: { fields: { id: { id: string }, name: string, image_url: { url: string }}};
  price: string;
}

interface ProviderListingsProps {
    listings: SuiObjectData[];
    isLoading: boolean;
}

export function ProviderListings({ listings, isLoading }: ProviderListingsProps) {
    const params = useParams();
    const locale = params.locale as string;

    return (
        <section>
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-6">
                <Sailboat />
                Experiencias a la Venta
            </h2>
            {isLoading && <div className="text-center text-muted-foreground p-4"><Loader className="animate-spin mx-auto"/></div>}
            
            {/* CORRECCIÓN: Se usa 'listings' para que coincida con las props */}
            {listings && listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map(listing => {
                       // CORRECCIÓN: Se añade una guarda para la seguridad de tipos.
                       if (listing.content?.dataType !== 'moveObject') return null;

                       const fields = listing.content.fields as unknown as ListingFields;
                       if (!fields) return null;
                       
                       return (
                           <ExperienceNftCard
                               key={listing.objectId}
                               listingId={listing.objectId}
                               nftId={fields.nft.fields.id.id}
                               name={fields.nft.fields.name}
                               imageUrl={fields.nft.fields.image_url.url}
                               price={Number(fields.price) / 1_000_000_000}
                           />
                       )
                    })}
                </div>
            ) : (
                !isLoading && <p className="text-muted-foreground p-8 text-center border-2 border-dashed rounded-lg">Este proveedor no tiene experiencias a la venta.</p>
            )}
        </section>
    );
}