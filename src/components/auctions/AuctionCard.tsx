// src/components/auctions/AuctionCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Gavel, Timer, Tag } from "lucide-react";
import { AuctionListing } from '@/hooks/useGetAuctions';

// Pequeño componente para el contador
function Countdown({ endTime }: { endTime: number }) {
    const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(endTime - Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    if (timeLeft <= 0) return <span>¡Finalizada!</span>;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return <span>{days}d {hours}h {minutes}m {seconds}s</span>;
}

export function AuctionCard({ auction }: { auction: AuctionListing }) {
    const params = useParams();
    const locale = params.locale as string;

    return (
        <Card className="glass-card card-hover flex flex-col h-full overflow-hidden">
            <CardHeader className="p-0">
                <div className="aspect-video overflow-hidden">
                    <img src={auction.nft.imageUrl} alt={auction.nft.name} className="w-full h-full object-cover"/>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg text-foreground line-clamp-2 leading-tight">{auction.nft.name}</CardTitle>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Tag/> Puja Actual:</span>
                        <span className="font-bold text-foreground">{auction.highestBid.toLocaleString()} SUI</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Timer/> Termina en:</span>
                        <span className="font-bold text-primary"><Countdown endTime={auction.endTime} /></span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-2">
                <Button asChild className="w-full btn-sui">
                    <Link href={`/${locale}/auctions/${auction.auctionId}`}>
                        <Gavel className="w-4 h-4 mr-2" /> Pujar Ahora
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}