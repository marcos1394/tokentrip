'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import Link from 'next/link';
import { useParams } from "next/navigation";

// La interfaz ahora acepta `currency`
interface ExperienceNftCardProps {
  listingId?: string; // Es opcional para cuando se usa en "Mis Experiencias"
  nftId: string;
  name: string;
  imageUrl: string;
  price?: number;
  currency?: 'SUI' | 'TKT'; // Se añade la moneda como prop opcional
}

export function ExperienceNftCard({ nftId, name, imageUrl, price, currency = 'SUI', listingId }: ExperienceNftCardProps) {
  const params = useParams();
  const locale = params.locale as string;

  // Si no hay un listingId, el enlace va al detalle del NFT, si no, al detalle del listing.
  const targetUrl = `/${locale}/experience/${listingId || nftId}`;

  return (
    <Link href={targetUrl} className="group block h-full">
      <Card className="glass-card card-hover h-full flex flex-col overflow-hidden">
        <CardHeader className="p-0">
          <div className="aspect-video overflow-hidden">
            <img src={imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg text-foreground line-clamp-2 leading-tight">{name}</CardTitle>
        </CardContent>
        
        {price !== undefined && (
          <CardFooter className="p-4 bg-slate-100/50 dark:bg-black/20 border-t">
              <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Precio</span>
                      {/* Muestra el símbolo de la moneda dinámicamente */}
                      <span className="text-xl font-bold text-foreground">{price.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex items-center text-primary">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      <span className="font-semibold">Comprar</span>
                  </div>
              </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}