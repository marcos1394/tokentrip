'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Store } from "lucide-react";

export function CtaSection() {
  return (
    <section id="unete" className="relative pt-24 pb-24 px-4 overflow-hidden">
        {/* Orbes decorativos */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 heading-gradient text-balance">
                ¿Listo para Unirte a la Revolución de las Experiencias?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
                Ya seas un creador de experiencias únicas o un viajero en busca de autenticidad, TokenTrip es tu plataforma. Empieza hoy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="outline" className="btn-sui-outline px-8 py-6 text-lg">
                    <Store className="w-5 h-5 mr-2" />
                    Conviértete en Proveedor
                </Button>
                <Button size="lg" className="btn-sui px-8 py-6 text-lg">
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Entrar al Marketplace
                </Button>
            </div>
        </div>
    </section>
  );
}