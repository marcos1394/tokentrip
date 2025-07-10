'use client';

import { Card, CardContent } from "@/components/ui/card";
import CountUp from 'react-countup';

// Datos de las estadísticas con textos en inglés y formato adicional
const stats = [
    { key: "24h Volume", value: 1247, prefix: "$", suffix: "" },
    { key: "Total Experiences", value: 894, prefix: "", suffix: "+" },
    { key: "Active Providers", value: 56, prefix: "", suffix: "" },
    { key: "Total TKT Staked", value: 234890, prefix: "", suffix: "" },
];

export function StatsSection() {
    return (
        <section className="py-20 px-4 bg-muted/20">
            <div className="container mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat) => (
                        <Card key={stat.key} className="glass-card card-hover text-center">
                            <CardContent className="p-6">
                                <div className="text-4xl lg:text-5xl font-bold text-primary">
                                    <CountUp
                                        end={stat.value}
                                        duration={2.75}
                                        separator=","
                                        prefix={stat.prefix}
                                        suffix={stat.suffix}
                                        enableScrollSpy // La animación empieza cuando el usuario ve la sección
                                        scrollSpyDelay={300}
                                    />
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