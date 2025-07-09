'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Ticket, Users } from "lucide-react";

export function FifaSection() {
  return (
    <section id="mundial" className="bg-muted/40 pt-24 pb-24 px-4 text-center">
      <div className="max-w-6xl mx-auto">
        <Badge className="mb-6" variant="destructive">
          Evento Principal: Mundial 2026
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 heading-gradient text-balance">
          Tu Pasaporte Digital para el Evento Más Grande del Mundo
        </h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto text-balance">
          Olvida el fraude, los revendedores y la incertidumbre. Con TokenTrip, tu entrada al Mundial 2026 es un activo digital seguro, verificable y con liquidez real en tus manos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-left">
          {/* Card 1: Ticket Seguro */}
          <div className="bg-background/50 p-6 rounded-lg border">
            <ShieldCheck className="w-10 h-10 mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">Ticket Anti-Fraude</h3>
            <p className="text-muted-foreground">
              Cada boleto es un NFT único en la blockchain de Sui. Su autenticidad y propiedad son 100% verificables, eliminando la posibilidad de falsificaciones.
            </p>
          </div>

          {/* Card 2: Mercado Secundario */}
          <div className="bg-background/50 p-6 rounded-lg border">
            <Ticket className="w-10 h-10 mb-4 text-blue-500" />
            <h3 className="text-xl font-bold mb-2">Mercado Justo y Líquido</h3>
            <p className="text-muted-foreground">
              ¿No puedes asistir? Vende tu entrada de forma segura en nuestro marketplace. El creador original recibe regalías, creando un ecosistema más justo.
            </p>
          </div>

          {/* Card 3: Experiencias Fraccionadas */}
          <div className="bg-background/50 p-6 rounded-lg border">
            <Users className="w-10 h-10 mb-4 text-purple-500" />
            <h3 className="text-xl font-bold mb-2">Experiencias VIP Compartidas</h3>
            <p className="text-muted-foreground">
              Júntate con tus amigos y adquieran una fracción de un palco de lujo. Co-poseer experiencias premium nunca fue tan fácil y accesible.
            </p>
          </div>
        </div>

        <Button size="lg" className="btn-sui px-8 py-6 text-lg">
          <Ticket className="w-5 h-5 mr-2" />
          Ver Experiencias del Mundial
        </Button>
      </div>
    </section>
  );
}