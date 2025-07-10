// app/[locale]/auctions/page.tsx
'use client';

import { useGetAuctions } from '@/hooks/useGetAuctions';
import { AnimatedBackground } from '@/components/animated-background';
import { AuctionCard } from '@/components/auctions/AuctionCard';
import { Loader, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';


// --- Sub-componente para el estado de carga ---
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[220px] w-full rounded-xl" />
                    <div className="space-y-2 p-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AuctionsPage() {
  const { data: auctions, isLoading } = useGetAuctions();

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <AnimatedBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold heading-gradient text-balance">The Auction House</h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Discover and bid on one-of-a-kind experiences. The highest bid takes it all!
          </p>
        </div>

        {/* --- Controles de Filtro y Ordenación --- */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
            <div className='flex gap-2'>
                <Button variant="secondary">All</Button>
                <Button variant="ghost">Art</Button>
                <Button variant="ghost">Travel</Button>
                <Button variant="ghost">Tickets</Button>
            </div>
            <div className='w-full sm:w-auto'>
                <Select defaultValue='ending-soon'>
                    <SelectTrigger className="sm:w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ending-soon">Ending Soon</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="highest-bid">Highest Bid</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && auctions && auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {auctions.map((auction) => (
              <AuctionCard key={auction.auctionId} auction={auction} />
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                <Gavel className="w-12 h-12" />
                <p className="text-lg font-semibold">No Active Auctions</p>
                <p>The auction floor is quiet for now. Check back soon!</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}