'use client';

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Zap } from "lucide-react";

export function SecuritySection() {
  const features = [
      { icon: Lock, text: "Tus activos están asegurados por la criptografía de Sui." },
      { icon: Shield, text: "Los contratos inteligentes garantizan transacciones justas y transparentes." },
      { icon: Zap, text: "Velocidad y costos de transacción casi nulos para una experiencia fluida." }
  ];

  return (
    <section id="seguridad" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
             <div className="absolute -top-16 -left-16 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse" />
             <Card className="glass-card p-8 text-center card-hover">
                <Shield className="w-24 h-24 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-4">Construido sobre Sui</h3>
                <p className="text-muted-foreground">Aprovechamos la arquitectura de objetos de Sui para ofrecer una seguridad y escalabilidad sin precedentes.</p>
            </Card>
          </div>
          <div>
            <Badge variant="secondary">Confianza y Seguridad</Badge>
            <h2 className="text-4xl md:text-5xl font-bold my-4 text-foreground text-balance">
              Tu Experiencia, Tu Propiedad Real.
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-balance">
              A diferencia de las plataformas tradicionales, en TokenTrip, tú tienes el control absoluto de tus activos digitales.
            </p>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}