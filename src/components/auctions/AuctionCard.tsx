'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Gavel, Timer, Tag } from "lucide-react";
import { AuctionListing } from '@/hooks/useGetAuctions';

// Componente de cuenta regresiva mejorado
function Countdown({ endTime, onEnd }: { endTime: number, onEnd: () => void }) {
    const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = endTime - Date.now();
            if (newTimeLeft <= 0) {
                clearInterval(timer);
                onEnd(); // Llama a la función onEnd cuando el tiempo se acaba
            }
            setTimeLeft(newTimeLeft);
        }, 1000);
        return () => clearInterval(timer);
    }, [endTime, onEnd]);

    if (timeLeft <= 0) return <span className="text-destructive font-bold">Ended!</span>;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return <span>{days > 0 && `${days}d `}{hours}h {minutes}m {seconds}s</span>;
}

export function AuctionCard({ auction }: { auction: AuctionListing }) {
    const [isAuctionActive, setIsAuctionActive] = useState(Date.now() < auction.endTime);

    const handleAuctionEnd = () => {
        setIsAuctionActive(false);
    };

    return (
        <Card className="glass-card card-hover flex flex-col h-full overflow-hidden group">
            <CardHeader className="p-0 relative">
                <Link href={`/auctions/${auction.auctionId}`} className="block aspect-video overflow-hidden">
                    <img 
                        src={auction.nft.imageUrl} 
                        alt={auction.nft.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                </Link>
                {/* Overlay para subastas finalizadas */}
                {!isAuctionActive && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl uppercase tracking-widest">Auction Ended</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg text-foreground line-clamp-2 leading-tight h-[56px]">
                    {auction.nft.name}
                </CardTitle>
                <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4"/>Current Bid:</span>
                        <span className="font-bold text-foreground text-base">{auction.highestBid.toLocaleString('en-US')} SUI</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Timer className="w-4 h-4"/>Time Left:</span>
                        <span className="font-bold text-primary text-base">
                            <Countdown endTime={auction.endTime} onEnd={handleAuctionEnd} />
                        </span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-2">
                <Button asChild className="w-full btn-sui">
                    <Link href={`/auctions/${auction.auctionId}`}>
                        <Gavel className="w-4 h-4 mr-2" />
                        {isAuctionActive ? 'Place Bid' : 'View Results'}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}