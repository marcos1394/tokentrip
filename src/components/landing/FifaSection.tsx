// Se ha eliminado 'use client' porque este componente no tiene interactividad.
// Ahora es un Componente de Servidor, lo que mejora el rendimiento.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Ticket, Users } from "lucide-react";
import Link from 'next/link';

export function FifaSection() {
  return (
    <section id="fifa2026" className="bg-muted/40 pt-24 pb-24 px-4 text-center">
      <div className="max-w-6xl mx-auto">
        <Badge className="mb-6" variant="destructive">
          Featured Event: World Cup 2026
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 heading-gradient text-balance">
          Your Digital Passport to the World's Biggest Event
        </h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto text-balance">
          Forget fraud, scalpers, and uncertainty. With TokenTrip, your World Cup 2026 ticket becomes a secure, verifiable digital asset with true liquidity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-left">
          {/* Card 1: Ticket Seguro */}
          <div className="bg-background/50 p-6 rounded-lg border card-hover">
            <ShieldCheck className="w-10 h-10 mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">Fraud-Proof Tickets</h3>
            <p className="text-muted-foreground">
              Every ticket is a unique NFT on the Sui blockchain. Its authenticity and ownership are 100% verifiable, eliminating the risk of counterfeits.
            </p>
          </div>

          {/* Card 2: Mercado Secundario */}
          <div className="bg-background/50 p-6 rounded-lg border card-hover">
            <Ticket className="w-10 h-10 mb-4 text-blue-500" />
            <h3 className="text-xl font-bold mb-2">Fair & Liquid Market</h3>
            <p className="text-muted-foreground">
              Can't make it? Sell your ticket securely on our marketplace. The original creator earns royalties, creating a fairer ecosystem for everyone.
            </p>
          </div>

          {/* Card 3: Experiencias Fraccionadas */}
          <div className="bg-background/50 p-6 rounded-lg border card-hover">
            <Users className="w-10 h-10 mb-4 text-purple-500" />
            <h3 className="text-xl font-bold mb-2">Shared VIP Experiences</h3>
            <p className="text-muted-foreground">
              Team up with friends to acquire a fraction of a luxury suite. Co-owning premium experiences has never been this easy or accessible.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="btn-sui px-8 py-6 text-lg">
          <Link href="/#explore-fifa">
            <Ticket className="w-5 h-5 mr-2" />
            Browse World Cup Events
          </Link>
        </Button>
      </div>
    </section>
  );
}