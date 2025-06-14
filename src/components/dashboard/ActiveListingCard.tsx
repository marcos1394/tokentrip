// src/components/dashboard/ActiveListingCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

// Interfaz para los datos que esperamos del objeto Listing
interface ListingData {
    content: {
        fields: {
            price: string;
            nft: {
                fields: {
                    name: string;
                    image_url: { url: string };
                }
            }
        }
    }
}

interface ActiveListingCardProps {
    listing: ListingData;
}

export function ActiveListingCard({ listing }: ActiveListingCardProps) {
    const { nft, price } = listing.content.fields;
    const priceInSui = Number(price) / 1_000_000_000;

    return (
        <Card className="glass-card card-hover flex flex-col">
            <CardHeader className="p-0">
                <img src={nft.fields.image_url.url} alt={nft.fields.name} className="w-full h-40 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="line-clamp-2 text-md text-foreground">{nft.fields.name}</CardTitle>
            </CardContent>
            <CardFooter className="p-4 border-t bg-slate-50 dark:bg-black/20">
                <Badge variant="secondary" className="flex items-center">
                    <Tag className="w-3 h-3 mr-2"/>
                    Precio: {priceInSui.toLocaleString()} SUI
                </Badge>
            </CardFooter>
        </Card>
    );
}