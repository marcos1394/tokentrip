// app/[locale]/governance/page.tsx
'use client';

import { useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useInfiniteQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import type { SuiEvent, SuiObjectResponse, EventId } from '@mysten/sui/client';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { ArrowLeft, Loader, PlusCircle, Lightbulb } from 'lucide-react';
import { ProposalCard, ProposalCardData } from '@/components/governance/ProposalCard';
import { StakingHeader } from '@/components/staking/StakingHeader';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Interfaces para mayor seguridad de tipos ---
interface ProposalCreatedEvent {
    proposal_id: string;
}

// --- Sub-componente para el estado de carga ---
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[150px] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );
}

export default function GovernancePage() {
    const suiClient = useSuiClient();
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');

    // --- Lógica de Datos Mejorada con Paginación (Infinite Scroll) ---
    const { 
        data: proposalsPages, 
        isLoading, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage 
    } = useInfiniteQuery({
        queryKey: ['dao-proposals', statusFilter, sortOrder],
        // Se ajusta la firma de la función para ser explícita con los tipos
        queryFn: async ({ pageParam = null }: { pageParam?: EventId | null }): Promise<{ data: ProposalCardData[], nextCursor: EventId | null }> => {
            const eventResponse = await suiClient.queryEvents({
                query: { MoveEventType: `${suiConfig.daoPackageId}::dao::ProposalCreated` },
                limit: 9,
                cursor: pageParam,
            });

            const proposalIds = eventResponse.data
                .map((event: SuiEvent) => (event.parsedJson as ProposalCreatedEvent)?.proposal_id)
                .filter(Boolean);

            if (proposalIds.length === 0) {
                return { data: [], nextCursor: null };
            }
            
            const proposalObjects = await suiClient.multiGetObjects({
                ids: proposalIds,
                options: { showContent: true }
            });

            const proposalsData = proposalObjects
                .filter((obj: SuiObjectResponse): obj is SuiObjectResponse & { data: any } => !!obj.data)
                .map((obj) => {
                    const fields = obj.data.content?.dataType === 'moveObject' ? obj.data.content.fields as any : null;
                    if (!fields) return null;
                    return { ...fields, objectId: obj.data.objectId };
                })
                .filter((p): p is ProposalCardData => p !== null)
                .sort((a, b) => Number(b.proposal_id) - Number(a.proposal_id));

            return {
                data: proposalsData,
                nextCursor: eventResponse.nextCursor ?? null, 
            };
        },
        
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });
    
    const proposals = proposalsPages?.pages.flatMap(page => page.data) ?? [];

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Link>
                    </Button>
                    <Button asChild className="btn-sui">
                        <Link href="/governance/create">
                            <PlusCircle className="w-4 h-4 mr-2" /> Create Proposal
                        </Link>
                    </Button>
                </div>
                
                <StakingHeader /> 
                <h2 className="text-center text-2xl text-muted-foreground -mt-12 mb-12">Governance Hub</h2>

                {/* Controles de Filtro y Ordenación */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 p-4 glass-card rounded-lg">
                    <div className='flex gap-2'>
                        <Button variant={statusFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setStatusFilter('all')}>All</Button>
                        <Button variant={statusFilter === 'active' ? 'secondary' : 'ghost'} onClick={() => setStatusFilter('active')}>Active</Button>
                        <Button variant={statusFilter === 'passed' ? 'secondary' : 'ghost'} onClick={() => setStatusFilter('passed')}>Passed</Button>
                        <Button variant={statusFilter === 'failed' ? 'secondary' : 'ghost'} onClick={() => setStatusFilter('failed')}>Failed</Button>
                    </div>
                    <div className='w-full sm:w-auto'>
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className="sm:w-[180px]">
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isLoading && <LoadingSkeleton />}

                {!isLoading && proposals.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {proposals.map((proposal) => (
                            <ProposalCard key={proposal.proposal_id} proposal={proposal} />
                        ))}
                    </div>
                )}
                
                {!isLoading && proposals.length === 0 && (
                    <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                        <Lightbulb className="w-12 h-12 text-primary" />
                        <p className="text-lg font-semibold text-foreground">No proposals found.</p>
                        <p>Be the first to shape the future of TokenTrip!</p>
                        <Button asChild className="mt-4 btn-sui">
                           <Link href="/governance/create">Create First Proposal</Link>
                        </Button>
                    </div>
                )}
                
                {/* Botón de Cargar Más */}
                {hasNextPage && (
                    <div className="text-center mt-12">
                        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline" className="glass-card">
                            {isFetchingNextPage ? <Loader className="animate-spin w-5 h-5 mr-2" /> : null}
                            {isFetchingNextPage ? 'Loading...' : 'Load More'}
                        </Button>
                    </div>
                )}
            </div>
            <Toaster/>
        </div>
    );
}