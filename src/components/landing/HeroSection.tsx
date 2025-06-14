'use client';

import { Button } from "@/components/ui/button";
import { Zap, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section id="inicio" className="relative text-center pt-36 pb-24 px-4 overflow-hidden">
        {/* Orbes decorativos */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse animation-delay-4000" />
        
        <div className="relative z-10">
            <Badge className="mb-6" variant="secondary">La Nueva Era de las Experiencias</Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 heading-gradient text-balance">
                TokenTrip: Posee,
                <br />
                Comercia y Fracciona
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto text-balance">
                La primera plataforma descentralizada en Sui que transforma tus viajes, boletos y actividades en activos digitales líquidos y dinámicos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-sui px-8 py-6 text-lg">
                    <Zap className="w-5 h-5 mr-2" />
                    Explorar Marketplace
                </Button>
                <Button size="lg" variant="outline" className="btn-sui-outline px-8 py-6 text-lg">
                    <Trophy className="w-5 h-5 mr-2" />
                    Ver Colecciones
                </Button>
            </div>
        </div>
    </section>
  );
}