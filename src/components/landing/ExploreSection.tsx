'use client';

import { useGetListings } from "@/hooks/useGetListings";
import { useTranslation } from "react-i18next";
import { ExperienceNftCard } from "@/components/ExperienceNftCard";
import { Badge } from "@/components/ui/badge";
import { Loader } from "lucide-react";

export function ExploreSection() {
  const { t } = useTranslation();
  const { data: listings, isLoading, isError } = useGetListings();

  return (
    <section id="explorar" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary">{t("explore.badge")}</Badge>
          <h2 className="text-4xl md:text-5xl font-bold my-4 text-foreground text-balance">
            {t("explore.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            {t("explore.description")}
          </p>
        </div>
        
        <div>
          {isLoading && 
            <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader className="w-8 h-8 animate-spin mr-3" />
                <span>Cargando experiencias...</span>
            </div>
          }
          {isError && 
            <div className="text-center py-10 text-destructive">
                <p>Error al cargar las experiencias. Por favor, intenta de nuevo.</p>
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
                  price={listing.price}
                  // --- CORRECCIÓN: Se pasa la moneda a la tarjeta ---
                  currency={listing.currency}
                />
              ))}
            </div>
          )}
          {!isLoading && !isError && (!listings || listings.length === 0) && (
            <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
              <p className="font-semibold">No hay experiencias disponibles en el mercado en este momento.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}