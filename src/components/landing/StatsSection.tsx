'use client';

import { Card, CardContent } from "@/components/ui/card";
// Asumimos un componente AnimatedCounter, si no, podemos usar un número estático
// import { AnimatedCounter } from "@/components/animated-counter";

export function StatsSection() {
  const stats = [
    { key: "Volumen 24h", value: 1247 },
    { key: "Total de Experiencias", value: 894 },
    { key: "Proveedores Activos", value: 56 },
    { key: "Total de TKT en Stake", value: 234890 },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.key} className="glass-card card-hover text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-primary">
                  {/* <AnimatedCounter end={stat.value} /> */}
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mt-2">
                  {stat.key}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}