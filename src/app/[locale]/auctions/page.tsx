// app/[locale]/auctions/page.tsx
'use client';

import { useGetAuctions } from '@/hooks/useGetAuctions';
import { AnimatedBackground } from '@/components/animated-background';
import { AuctionCard } from '@/components/auctions/AuctionCard';
import { Loader } from 'lucide-react';

export default function AuctionsPage() {
  const { data: auctions, isLoading } = useGetAuctions();

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <AnimatedBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold heading-gradient text-balance">Casa de Subastas</h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Encuentra experiencias únicas y puja por ellas. ¡La oferta más alta se lo lleva todo!
          </p>
        </div>

        {isLoading && <div className="text-center p-12"><Loader className="animate-spin mx-auto h-12 w-12"/></div>}

        {!isLoading && auctions && auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {auctions.map((auction) => (
              <AuctionCard key={auction.auctionId} auction={auction} />
            ))}
          </div>
        ) : (
          !isLoading && <p className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">No hay subastas activas en este momento.</p>
        )}
      </div>
    </div>
  );
}