'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";

// Interfaces
interface ProposalFields {
    proposal_id: string;
    creator: string;
    title: string;
    description: string;
    for_votes: string;
    against_votes: string;
    end_timestamp_ms: string;
    is_executed: boolean;
}

export default function ProposalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const proposalId = params.proposalId as string;
    const locale = params.locale as string;
    
    const { mutate: executeVote, isPending: isVotePending } = useSignAndExecuteTransaction();
    const { mutate: executeProposal, isPending: isExecutePending } = useSignAndExecuteTransaction();
    
    const { data: proposalData, isLoading: isLoadingProposal } = useSuiClientQuery(
        'getObject', { id: proposalId, options: { showContent: true } }, { queryKey: ['proposal', proposalId] }
    );

    const { data: tktBalanceData } = useSuiClientQuery(
        'getBalance',
        { owner: currentAccount?.address!, coinType: `${suiConfig.tktPackageId}::tkt::TKT` },
        { enabled: !!currentAccount, queryKey: ['tkt-balance', currentAccount?.address] }
    );
    
    const handleVote = async (voteFor: boolean) => {
        if (!currentAccount?.address || !tktBalanceData || BigInt(tktBalanceData.totalBalance) <= 0n) {
            toast({ variant: 'destructive', title: 'No puedes votar' });
            return;
        }

        const tx = new Transaction();
        const tktCoinType = `${suiConfig.tktPackageId}::tkt::TKT`;
        
        const { data: userTktCoins } = await suiClient.getCoins({ owner: currentAccount.address, coinType: tktCoinType });
        const [mainCoin, ...otherCoins] = userTktCoins;

        if (!mainCoin) return;

        const coinToVoteWith = tx.object(mainCoin.coinObjectId);
        if (otherCoins.length > 0) {
            tx.mergeCoins(coinToVoteWith, otherCoins.map(c => c.coinObjectId));
        }

        tx.moveCall({
            target: `${suiConfig.daoPackageId}::dao::vote`,
            arguments: [ tx.object(proposalId), coinToVoteWith, tx.pure.bool(voteFor), tx.object("0x6") ],
        });

        executeVote({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ Voto Emitido' });
                queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });
            },
            onError: (error) => {
                toast({ variant: 'destructive', title: '❌ Error al Votar', description: error.message });
            }
        });
    };
    
    const handleExecute = () => {
        if (!proposal) return;
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.daoPackageId}::dao::execute_proposal`,
            arguments: [ tx.object(proposalId), tx.object(suiConfig.daoTreasuryId!), tx.object("0x6") ]
        });
        executeProposal({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ ¡Propuesta Ejecutada!' });
                queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });
            },
            onError: (error) => {
                toast({ variant: 'destructive', title: '❌ Error al Ejecutar', description: error.message });
            }
        });
    };

    const proposal = proposalData?.data?.content?.dataType === 'moveObject' ? proposalData.data.content.fields as unknown as ProposalFields : null;

    const forVotesNum = useMemo(() => proposal ? Number(proposal.for_votes) : 0, [proposal]);
    const againstVotesNum = useMemo(() => proposal ? Number(proposal.against_votes) : 0, [proposal]);
    const totalVotesNum = forVotesNum + againstVotesNum;
    const forPercentage = totalVotesNum > 0 ? (forVotesNum / totalVotesNum) * 100 : 0;
    const againstPercentage = totalVotesNum > 0 ? (againstVotesNum / totalVotesNum) * 100 : 0;
    const endDate = proposal ? new Date(Number(proposal.end_timestamp_ms)) : new Date();
    const isVotingActive = new Date() < endDate && !proposal?.is_executed;
    
    // CORRECCIÓN: Se usan las variables `...Num` para la comparación
    const canBeExecuted = !isVotingActive && proposal && !proposal.is_executed && forVotesNum > againstVotesNum;
    
    if (isLoadingProposal) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
    if (!proposal) return <div className="min-h-screen flex items-center justify-center">Propuesta no encontrada.</div>;

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href={`/${locale}/governance`}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Propuestas
                        </Link>
                    </Button>
                </div>
                
                <div className="max-w-4xl mx-auto space-y-8">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardDescription>Propuesta #{proposal.proposal_id}</CardDescription>
                            <CardTitle className="text-3xl font-bold text-foreground text-balance">{proposal.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">Propuesta por: <span className="font-mono">{proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}</span></p>
                        </CardHeader>
                        <CardContent><p className="text-foreground/80 whitespace-pre-wrap">{proposal.description}</p></CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader><CardTitle className="text-foreground">Resultados Actuales</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1 text-sm"><span className="font-semibold text-green-500">A Favor</span><span className="text-muted-foreground">{forPercentage.toFixed(2)}%</span></div>
                                <Progress value={forPercentage} className="h-3 [&>div]:bg-green-500" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-1 text-sm"><span className="font-semibold text-red-500">En Contra</span><span className="text-muted-foreground">{againstPercentage.toFixed(2)}%</span></div>
                                <Progress value={againstPercentage} className="h-3 [&>div]:bg-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    {isVotingActive && (
                        <Card className="glass-card border-primary/50">
                            <CardHeader>
                                <CardTitle className="text-foreground">Emite tu Voto</CardTitle>
                                <CardDescription>Tu poder de voto es igual a tu balance de TKT. Los tokens no se gastan.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVote(true)} disabled={!currentAccount || isVotePending}><ThumbsUp className="w-5 h-5 mr-2"/> Votar a Favor</Button>
                                <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => handleVote(false)} disabled={!currentAccount || isVotePending}><ThumbsDown className="w-5 h-5 mr-2"/> Votar en Contra</Button>
                            </CardContent>
                        </Card>
                    )}

                    {!isVotingActive && (
                         <Card className={`glass-card text-center p-6 ${proposal.is_executed ? 'bg-green-500/10 border-green-500/30' : ''}`}>
                            {proposal.is_executed ? <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4"/> : <XCircle className="w-12 h-12 mx-auto text-destructive mb-4"/>}
                            <CardTitle className="text-foreground">{proposal.is_executed ? "Propuesta Ejecutada" : "Votación Cerrada"}</CardTitle>
                            {/* CORRECCIÓN: Se usan las variables `...Num` para la comparación */}
                            <CardDescription>
                                {forVotesNum > againstVotesNum ? 'La propuesta fue APROBADA.' : 'La propuesta fue RECHAZADA.'}
                            </CardDescription>
                        </Card>
                    )}

                    {canBeExecuted && (
                        <div className="pt-4">
                             <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleExecute} disabled={isExecutePending}>
                                <Zap className="w-5 h-5 mr-2" />
                                {isExecutePending ? "Ejecutando..." : "Ejecutar Propuesta"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <Toaster/>
        </div>
    );
}