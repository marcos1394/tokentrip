// Se ha eliminado 'use client' porque este componente no tiene estado ni interactividad.
// Ahora es un Componente de Servidor, lo que mejora el rendimiento de la página.
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Zap } from "lucide-react";

// Definimos las características fuera del componente, ya que son estáticas.
const securityFeatures = [
    { 
        icon: Lock, 
        text: "Your assets are secured by Sui's robust, cutting-edge cryptography." 
    },
    { 
        icon: Shield, 
        text: "Smart contracts guarantee fair, transparent, and unstoppable transactions." 
    },
    { 
        icon: Zap, 
        text: "Near-zero gas fees and lightning-fast speed for a seamless user experience." 
    }
];

export function SecuritySection() {
  return (
    <section id="security" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Columna Izquierda: Tarjeta Visual "Built on Sui" */}
          <div className="relative">
              <div className="absolute -top-16 -left-16 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse" />
              <Card className="glass-card p-8 text-center card-hover">
                  <Shield className="w-24 h-24 text-primary mx-auto mb-6" strokeWidth={1.5} />
                  <h3 className="text-2xl font-bold text-foreground mb-4">Built on Sui</h3>
                  <p className="text-muted-foreground">
                    We leverage Sui's unique object-centric architecture to deliver unparalleled security, ownership, and scalability.
                  </p>
              </Card>
          </div>

          {/* Columna Derecha: Texto y Beneficios */}
          <div>
            <Badge variant="secondary">Trust & Security</Badge>
            <h2 className="text-4xl md:text-5xl font-bold my-4 text-foreground text-balance">
              True Digital Ownership, Guaranteed.
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-balance">
              Unlike traditional platforms, TokenTrip gives you absolute and verifiable control over your digital assets. No intermediaries, no hidden rules.
            </p>
            <div className="space-y-6">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}