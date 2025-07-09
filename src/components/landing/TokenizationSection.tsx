'use client';

import { Badge } from "@/components/ui/badge";
import { Coins, Handshake, Gem } from "lucide-react";

// Placeholder para un futuro componente dinámico que usará los hooks
// import { FeaturedItemsCarousel } from "./FeaturedItemsCarousel";

export function TokenizationSection() {
  return (
    <section id="tokenizacion" className="bg-background pt-24 pb-24 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <Badge className="mb-6" variant="secondary">
            El Poder de la Propiedad Digital
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 heading-gradient text-balance">
            Transforma Experiencias en Activos
        </h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto text-balance">
            En TokenTrip, tus boletos y reservaciones no son solo códigos QR. Son activos digitales que te pertenecen y con los que puedes interactuar.
        </p>

        {/* Los 3 Pilares de la Tokenización */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-left">
          {/* Card 1: Poseer */}
          <div className="bg-muted/40 p-6 rounded-lg border border-transparent hover:border-blue-500/50 transition-all">
            <Gem className="w-10 h-10 mb-4 text-blue-500" />
            <h3 className="text-xl font-bold mb-2">1. Poseer de Verdad</h3>
            <p className="text-muted-foreground">
              Cada experiencia es un NFT único en tu wallet. Es tuyo, no de una plataforma. Tienes control total para guardarlo, transferirlo o mostrarlo en tu pasaporte digital.
            </p>
          </div>

          {/* Card 2: Comerciar */}
          <div className="bg-muted/40 p-6 rounded-lg border border-transparent hover:border-green-500/50 transition-all">
            <Handshake className="w-10 h-10 mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">2. Comerciar con Liquidez</h3>
            <p className="text-muted-foreground">
              ¿No puedes ir? Vende tu experiencia en nuestro mercado secundario. Lo que antes era una pérdida de dinero, ahora es una oportunidad. Dale liquidez a tus planes.
            </p>
          </div>

          {/* Card 3: Fraccionar */}
          <div className="bg-muted/40 p-6 rounded-lg border border-transparent hover:border-purple-500/50 transition-all">
            <Coins className="w-10 h-10 mb-4 text-purple-500" />
            <h3 className="text-xl font-bold mb-2">3. Fraccionar y Compartir</h3>
            <p className="text-muted-foreground">
              Las mejores experiencias se comparten. Fracciona la propiedad de un palco VIP o una villa de lujo entre amigos. Invierte en grande, pero en grupo.
            </p>
          </div>
        </div>

        {/* Aquí es donde la magia de los hooks entra en juego */}
        <div className="bg-muted/20 p-8 rounded-xl border">
             <h3 className="text-2xl font-bold mb-4">Activos Destacados del Marketplace</h3>
             <p className="text-muted-foreground mb-6">
                Estos son ejemplos reales de experiencias tokenizadas que se están comerciando ahora mismo en nuestra plataforma.
             </p>
             {/* Aquí iría un componente como <FeaturedItemsCarousel /> 
                que usaría los hooks 'useGetListings' y 'useGetAuctions' 
                para mostrar una selección de los activos más interesantes.
             */}
             <div className="h-40 flex items-center justify-center bg-background/40 rounded-lg">
                <p className="text-muted-foreground italic">[Carrusel de Listings y Subastas en vivo aquí]</p>
             </div>
        </div>
      </div>
    </section>
  );
}