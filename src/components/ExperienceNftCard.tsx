// Se ha eliminado 'use client', convirtiéndolo en un Componente de Servidor más rápido,
// ya que no necesita hooks del lado del cliente.
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import Link from 'next/link';

// La interfaz se mantiene flexible
interface ExperienceNftCardProps {
    listingId?: string;
    nftId: string;
    name: string;
    imageUrl: string;
    price?: number;
    currency?: 'SUI' | 'TKT';
}

export function ExperienceNftCard({ 
    nftId, 
    name, 
    imageUrl, 
    price, 
    currency = 'SUI', 
    listingId 
}: ExperienceNftCardProps) {

    // El enlace ahora es estático, sin el 'locale'
    const targetUrl = `/experience/${listingId || nftId}`;

    return (
        <Link href={targetUrl} className="group block h-full">
            <Card className="glass-card card-hover h-full flex flex-col overflow-hidden">
                <CardHeader className="p-0">
                    <div className="aspect-video overflow-hidden">
                        <img 
                            src={imageUrl} 
                            alt={name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-lg text-foreground line-clamp-2 leading-tight h-[56px]">{name}</CardTitle>
                </CardContent>
                
                {/* El footer solo se muestra si hay un precio, lo cual es una excelente lógica */}
                {price !== undefined && (
                    <CardFooter className="p-4 bg-muted/20 border-t">
                         <div className="flex items-center justify-between w-full">
                             <div className="flex flex-col">
                                 <span className="text-xs text-muted-foreground">Price</span>
                                 <span className="text-xl font-bold text-foreground">
                                    {price.toLocaleString('en-US', { maximumFractionDigits: 2 })} {currency}
                                 </span>
                             </div>
                             {/* CTA Mejorado */}
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