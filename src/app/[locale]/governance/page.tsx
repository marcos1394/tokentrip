'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SuiObjectResponse } from '@mysten/sui/client';
import type { SuiEvent } from '@mysten/sui/client';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { ArrowLeft, Loader, PlusCircle } from 'lucide-react';
import { ProposalCard, ProposalCardData } from '@/components/governance/ProposalCard';
import { StakingHeader } from '@/components/staking/StakingHeader';

export default function GovernancePage() {
    const params = useParams();
    const locale = params.locale as string;
    const suiClient = useSuiClient();

    // --- CORRECCIÓN: Se usa `queryEvents` y `multiGetObjects` para obtener las propuestas ---
    const { data: proposals, isLoading } = useQuery({
        queryKey: ['dao-proposals'],
        queryFn: async (): Promise<ProposalCardData[]> => {
            // 1. Buscamos todos los eventos que indican que una propuesta fue creada.
            const eventResponse = await suiClient.queryEvents({
                query: { MoveEventType: `${suiConfig.daoPackageId}::dao::ProposalCreated` }
            });

            const proposalIds = eventResponse.data
                .map((event: SuiEvent) => (event.parsedJson as any)?.proposal_id)
                .filter(Boolean);

            if (proposalIds.length === 0) {
                return [];
            }
            
            // 2. Con los IDs, buscamos los datos de cada objeto Propuesta.
            const proposalObjects = await suiClient.multiGetObjects({
                ids: proposalIds,
                options: { showContent: true }
            });

            // 3. Mapeamos los resultados al formato que necesita nuestra UI.
            return proposalObjects
                .filter((obj: SuiObjectResponse) => obj.data) // Filtramos por si alguno dio error
                .map((obj: SuiObjectResponse) => {
                    const fields = obj.data?.content?.dataType === 'moveObject' ? obj.data.content.fields as any : null;
                    if (!fields) return null;
                    // El ID de la propuesta es el ID del objeto en sí, no el campo interno.
                    return { ...fields, objectId: obj.data?.objectId };
                })
                .filter((p: ProposalCardData | null): p is ProposalCardData => p !== null)
                .sort((a: ProposalCardData, b: ProposalCardData) => Number(b.proposal_id) - Number(a.proposal_id));
        }
    });

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href={`/${locale}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
                        </Link>
                    </Button>
                    <Button asChild className="btn-sui">
                        <Link href={`/${locale}/governance/create`}>
                            <PlusCircle className="w-4 h-4 mr-2" /> Crear Propuesta
                        </Link>
                    </Button>
                </div>

                {/* Usamos un componente genérico para el título, puedes crear uno específico si quieres */}
                <StakingHeader /> 
                <h2 className="text-center text-2xl text-muted-foreground -mt-12 mb-16">Centro de Gobernanza</h2>

                {isLoading && <div className="text-center p-12"><Loader className="animate-spin mx-auto h-8 w-8"/></div>}

                {!isLoading && proposals && proposals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {proposals.map((proposal: ProposalCardData) => (
                            <ProposalCard key={proposal.proposal_id} proposal={proposal} />
                        ))}
                    </div>
                ) : (
                    !isLoading && <p className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">No hay propuestas activas en este momento. ¡Sé el primero en crear una!</p>
                )}
            </div>
            <Toaster/>
        </div>
    );
}