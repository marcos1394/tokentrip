// Se ha eliminado 'use client' porque este componente no tiene interactividad.
// Ahora es un Componente de Servidor, lo que mejora el rendimiento.
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight, Store } from "lucide-react";

export function CtaSection() {
  return (
    <section id="join" className="relative pt-24 pb-32 px-4 overflow-hidden">
        {/* Orbes decorativos */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 heading-gradient text-balance">
              Ready to Join the New Experience Economy?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
              Whether you're a creator looking to tokenize your services or a traveler ready to own your adventures, the journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="outline" className="btn-sui-outline px-8 py-6 text-lg">
                    <Link href="/register-provider">
                      <Store className="w-5 h-5 mr-2" />
                      Become a Provider
                    </Link>
                </Button>
                <Button asChild size="lg" className="btn-sui px-8 py-6 text-lg">
                    <Link href="/#explore">
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Explore Marketplace
                    </Link>
                </Button>
            </div>
        </div>
    </section>
  );
}