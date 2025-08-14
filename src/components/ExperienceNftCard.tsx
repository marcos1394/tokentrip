import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import Link from 'next/link';

// Interfaz actualizada para recibir contentType
interface ExperienceNftCardProps {
    listingId?: string;
    nftId: string;
    name: string;
    imageUrl: string;
    contentType: string;
    price?: number;
    currency?: 'SUI' | 'TKT';
}

export function ExperienceNftCard({ 
    nftId, 
    name, 
    imageUrl, 
    contentType,
    price, 
    currency = 'SUI', 
    listingId 
}: ExperienceNftCardProps) {

    const targetUrl = `/es/experience/${listingId || nftId}`;
    const isMediaViewable = contentType.startsWith("image/") || contentType.startsWith("video/");

    return (
        <Link href={targetUrl} className="group block h-full">
            <Card className="glass-card card-hover h-full flex flex-col overflow-hidden">
                <CardHeader className="p-0">
                    <div className="aspect-video overflow-hidden bg-muted">
                        {/* --- LA SOLUCIÓN FINAL: USAR LA ETIQUETA <object> --- */}
                        <object 
                            type={isMediaViewable ? contentType : ''} 
                            data={isMediaViewable ? imageUrl : ''} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        >
                            {/* Fallback por si el navegador no puede renderizar el objeto */}
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">Media not available</p>
                            </div>
                        </object>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-lg text-foreground line-clamp-2 leading-tight h-[56px]">{name}</CardTitle>
                </CardContent>
                
                {price !== undefined && (
                    <CardFooter className="p-4 bg-muted/20 border-t">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Price</span>
                                <span className="text-xl font-bold text-foreground">
                                    {price.toLocaleString('en-US', { maximumFractionDigits: 2 })} {currency}
                                </span>
                            </div>
                            <Badge className="bg-primary/90 text-primary-foreground">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                <span className="font-semibold">Buy Now</span>
                            </Badge>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
}
