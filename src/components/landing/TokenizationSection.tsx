// Se ha eliminado 'use client' porque este componente no tiene estado ni interactividad.
// Ahora es un Componente de Servidor, lo que mejora el rendimiento de la página.
import { Badge } from "@/components/ui/badge";
import { Coins, Handshake, Gem } from "lucide-react";

export function TokenizationSection() {
  return (
    <section id="how-it-works" className="bg-background pt-24 pb-24 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <Badge className="mb-6" variant="secondary">
            The Power of Digital Ownership
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 heading-gradient text-balance">
            Transform Experiences into Assets
        </h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto text-balance">
          On TokenTrip, your tickets and reservations are more than just QR codes. They are digital assets that you truly own and control.
        </p>

        {/* Los 3 Pilares de la Tokenización */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-left">
          {/* Card 1: Own */}
          <div className="bg-muted/40 p-8 rounded-lg border card-hover">
            <Gem className="w-10 h-10 mb-4 text-blue-500" />
            <h3 className="text-xl font-bold mb-2">1. True Ownership</h3>
            <p className="text-muted-foreground">
              Each experience is a unique NFT in your wallet. It's yours, not the platform's. You have total control to hold, transfer, or showcase it in your digital passport.
            </p>
          </div>

          {/* Card 2: Trade */}
          <div className="bg-muted/40 p-8 rounded-lg border card-hover">
            <Handshake className="w-10 h-10 mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">2. Liquid & Tradable</h3>
            <p className="text-muted-foreground">
              Can't make it? Sell your experience on our secondary market. What was once a sunk cost is now an opportunity. Unlock the liquidity of your plans.
            </p>
          </div>

          {/* Card 3: Fractionalize */}
          <div className="bg-muted/40 p-8 rounded-lg border card-hover">
            <Coins className="w-10 h-10 mb-4 text-purple-500" />
            <h3 className="text-xl font-bold mb-2">3. Fractional & Composable</h3>
            <p className="text-muted-foreground">
              The best experiences are shared. Fractionalize ownership of a luxury VIP suite or a vacation villa among friends. Invest in big-ticket items, together.
            </p>
          </div>
        </div>

        {/* Placeholder para el carrusel dinámico futuro */}
        <div className="bg-muted/20 p-8 rounded-xl border">
             <h3 className="text-2xl font-bold mb-4">Featured Marketplace Assets</h3>
             <p className="text-muted-foreground mb-6">
                These are real-time examples of tokenized experiences being traded right now on our platform.
             </p>
             <div className="h-40 flex items-center justify-center bg-background/40 rounded-lg">
                <p className="text-muted-foreground italic">[Live listings and auctions carousel here]</p>
             </div>
        </div>
      </div>
    </section>
  );
}