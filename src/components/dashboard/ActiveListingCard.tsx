// src/components/dashboard/ActiveListingCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Button } from "../ui/button";

// --- Interfaces Mejoradas ---

interface NftFields {
    name: string;
    image_url: { url: string };
}

interface ListingFields {
    price: string;
    nft: { fields: NftFields };
    is_tkt_listing: boolean; // Se añade para determinar la moneda
}

// La prop `listing` ahora se espera que sea el objeto 'data' completo de SuiObjectResponse
interface ActiveListingCardProps {
    listing: {
        objectId: string;
        content?: {
            fields: ListingFields;
        } | null;
    };
}

export function ActiveListingCard({ listing }: ActiveListingCardProps) {
    // --- Lógica y Extracción de Datos ---
    if (!listing.content) {
        return null; // No renderizar si no hay contenido
    }
    const { nft, price, is_tkt_listing } = listing.content.fields;
    
    // Se usa BigInt para seguridad y precisión
    const priceFormatted = (Number(BigInt(price)) / 1e9).toLocaleString('en-US', { maximumFractionDigits: 2 });
    const currency = is_tkt_listing ? "TKT" : "SUI";

    const handleDelist = () => {
        // Lógica para quitar el listing
        console.log("Delisting item:", listing.objectId);
        // Aquí iría la llamada a una transacción de 'delist_item'
    };

    return (
        <Card className="glass-card card-hover flex flex-col group overflow-hidden">
            <Link href={`/experience/${listing.objectId}`} className="block">
                <CardHeader className="p-0 relative">
                    <img 
                        src={nft.fields.image_url.url} 
                        alt={nft.fields.name} 
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <CardTitle className="line-clamp-2 text-md text-foreground">{nft.fields.name}</CardTitle>
                </CardContent>
            </Link>
            <CardFooter className="p-3 border-t bg-slate-50 dark:bg-black/20 flex justify-between items-center">
                <Badge variant="secondary" className="flex items-center font-semibold">
                    <Tag className="w-3 h-3 mr-2"/>
                    {priceFormatted} {currency}
                </Badge>

                {/* --- Menú de Acciones --- */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-effect">
                        <DropdownMenuItem asChild>
                            <Link href={`/experience/${listing.objectId}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Listing</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={handleDelist}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delist</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
}