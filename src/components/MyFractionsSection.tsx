'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { Badge } from '@/components/ui/badge';
import { MyFractions } from '@/components/MyFractions';

export function MyFractionsSection() {
    const currentAccount = useCurrentAccount();

    // Esta lógica es perfecta: la sección solo aparece si el usuario está conectado.
    if (!currentAccount) {
        return null; 
    }

    return (
        <section id="my-fractions" className="py-20 px-4 bg-slate-100/50 dark:bg-slate-800/20">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <Badge variant="secondary">My Portfolio</Badge>
                    <h2 className="text-4xl md:text-5xl font-bold my-4 text-foreground text-balance">
                        My Fractional Shares
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
                        These are the shares of experiences you own. Trade them individually or bundle them to redeem the full experience.
                    </p>
                </div>
                <MyFractions />
            </div>
        </section>
    );
}