// app/[locale]/governance/[proposalId]/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { ArrowLeft, Loader, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Zap, Info, Clock, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Badge } from '@/components/ui/badge';

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

// Componente de Cuenta Regresiva
function Countdown({ endTime }: { endTime: number }) {
    const [timeLeft, setTimeLeft] = useState(endTime - Date.now());
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(endTime - Date.now()), 1000);
        return () => clearInterval(timer);
    }, [endTime, timeLeft]);

    if (timeLeft <= 0) return <span className="text-destructive font-bold">Ended</span>;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return <span>{days > 0 && `${days}d `}{hours}h {minutes}m {seconds}s</span>;
}

export default function ProposalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const proposalId = params.proposalId as string;
    
    const { mutateAsync: executeVote, isPending: isVotePending } = useSignAndExecuteTransaction();
    const { mutateAsync: executeProposal, isPending: isExecutePending } = useSignAndExecuteTransaction();
    
    const { data: proposalData, isLoading: isLoadingProposal } = useSuiClientQuery('getObject', { id: proposalId, options: { showContent: true } }, { queryKey: ['proposal', proposalId], refetchInterval: 10000 });
    const { data: tktBalanceData } = useSuiClientQuery('getBalance', { owner: currentAccount?.address!, coinType: `${suiConfig.tktPackageId}::tkt::TKT` }, { enabled: !!currentAccount, queryKey: ['tkt-balance', currentAccount?.address] });
    
    const proposal = proposalData?.data?.content?.dataType === 'moveObject' ? proposalData.data.content.fields as unknown as ProposalFields : null;

    // --- Lógica de Transacciones Corregida ---
    const handleVote = async (voteFor: boolean) => {
        if (!currentAccount?.address || !tktBalanceData || BigInt(tktBalanceData.totalBalance) <= 0n) {
            toast({ variant: 'destructive', title: 'Cannot Vote', description: 'You must hold TKT to vote.' });
            return;
        }
        const tx = new Transaction();
        const tktCoinType = `${suiConfig.tktPackageId}::tkt::TKT`;
        const { data: userTktCoins } = await suiClient.getCoins({ owner: currentAccount.address, coinType: tktCoinType });
        if (!userTktCoins || userTktCoins.length === 0) return;
        
        const [mainCoin, ...otherCoins] = userTktCoins;
        const coinToVoteWith = tx.object(mainCoin.coinObjectId);
        if (otherCoins.length > 0) {
            tx.mergeCoins(coinToVoteWith, otherCoins.map(c => c.coinObjectId));
        }
        tx.moveCall({
            target: `${suiConfig.daoPackageId}::dao::vote`,
            arguments: [ tx.object(proposalId), coinToVoteWith, tx.pure.bool(voteFor), tx.object("0x6") ],
        });
        
        try {
            await executeVote({ transaction: tx });
            toast({ title: '✅ Vote Cast Successfully!' });
            queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Voting Failed', description: error.message });
        }
    };
    
    const handleExecute = async () => {
        if (!proposal) return;
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.daoPackageId}::dao::execute_proposal`,
            arguments: [ tx.object(proposalId), tx.object(suiConfig.daoTreasuryId!), tx.object("0x6") ]
        });
        
        try {
            await executeProposal({ transaction: tx });
            toast({ title: '✅ Proposal Executed!', description: "The proposal's action has been completed." });
            queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Execution Failed', description: error.message });
        }
    };

    // --- Cálculos de UI con BigInt para seguridad y claridad ---
    const { forVotes, againstVotes, totalVotes, forPercentage, againstPercentage, endDate, status, canBeExecuted } = useMemo(() => {
       if (!proposal) {
            return {
                forVotes: 0n,
                againstVotes: 0n,
                totalVotes: 0n,
                forPercentage: 0,
                againstPercentage: 0,
                endDate: new Date(),
                status: 'Loading',
                canBeExecuted: false
            };
        }

        // Si hay datos, procedemos con los cálculos normales usando BigInt
        const forVotes = BigInt(proposal.for_votes);
        const againstVotes = BigInt(proposal.against_votes);
        const totalVotes = forVotes + againstVotes;
        
        // Se evita la división por cero y se calcula el porcentaje con BigInt antes de convertir a Number
        const forPercentage = totalVotes > 0n ? Number((forVotes * 10000n / totalVotes)) / 100 : 0;
        const againstPercentage = totalVotes > 0n ? 100 - forPercentage : 0;
        
        const endDate = new Date(Number(proposal.end_timestamp_ms));
        const isVotingActive = new Date() < endDate && !proposal.is_executed;
        
        let status = 'Active';
        if (proposal.is_executed) {
            status = 'Executed';
        } else if (!isVotingActive) {
            status = forVotes > againstVotes ? 'Passed' : 'Failed';
        }

        const canBeExecuted = status === 'Passed';

        return { forVotes, againstVotes, totalVotes, forPercentage, againstPercentage, endDate, status, canBeExecuted };
    }, [proposal]);

    if (isLoadingProposal) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10" /></div>;
    if (!proposal) return <div className="min-h-screen flex items-center justify-center">Proposal not found.</div>;

    const tktBalance = tktBalanceData ? Number(BigInt(tktBalanceData.totalBalance) / BigInt(10**9)) : 0;

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/governance"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Proposals</Link>
                    </Button>
                </div>
                
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Tarjeta Principal de la Propuesta */}
                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardDescription>Proposal #{proposal.proposal_id}</CardDescription>
                                <Badge variant={status === 'Active' ? 'default' : (status === 'Executed' || status === 'Passed' ? 'secondary' : 'destructive')}>{status}</Badge>
                            </div>
                            <CardTitle className="text-3xl font-bold text-foreground text-balance pt-2">{proposal.title}</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-foreground/80 whitespace-pre-wrap">{proposal.description}</p></CardContent>
                    </Card>

                    {/* Contenedor de Detalles y Resultados */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Detalles Clave */}
                        <Card className="glass-card">
                            <CardHeader><CardTitle>Key Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Creator</span><span className="font-mono">{proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}</span></div>
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">End Date</span><span className="font-medium">{endDate.toLocaleString()}</span></div>
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Total Votes</span><span className="font-medium">{(Number(totalVotes) / 1e9).toLocaleString()}</span></div>
                            </CardContent>
                        </Card>
                        {/* Resultados de Votación */}
                        <Card className="glass-card">
                            <CardHeader><CardTitle>Current Results</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1 text-sm"><span className="font-semibold text-green-500">For</span><span className="text-muted-foreground">{forPercentage.toFixed(2)}% ({ (Number(forVotes) / 1e9).toLocaleString() })</span></div>
                                    <Progress value={forPercentage} className="h-2 [&>div]:bg-green-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1 text-sm"><span className="font-semibold text-red-500">Against</span><span className="text-muted-foreground">{againstPercentage.toFixed(2)}% ({ (Number(againstVotes) / 1e9).toLocaleString() })</span></div>
                                    <Progress value={againstPercentage} className="h-2 [&>div]:bg-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tarjeta de Acción: Votar */}
                    {status === 'Active' && (
                        <Card className="glass-card border-primary/50">
                            <CardHeader>
                                <CardTitle className="text-foreground">Cast Your Vote</CardTitle>
                                <CardDescription>Your voting power is equal to your TKT balance. Tokens are used to vote but are not spent.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <div className="text-center p-3 bg-background/50 rounded-lg"><span className="text-muted-foreground text-sm">Your Voting Power: </span><span className="font-bold text-primary">{tktBalance.toLocaleString()} TKT</span></div>
                               <div className="flex flex-col sm:flex-row gap-4">
                                    <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVote(true)} disabled={!currentAccount || isVotePending}><ThumbsUp className="w-5 h-5 mr-2"/> Vote For</Button>
                                    <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => handleVote(false)} disabled={!currentAccount || isVotePending}><ThumbsDown className="w-5 h-5 mr-2"/> Vote Against</Button>
                               </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tarjeta de Acción: Ejecutar */}
                    {canBeExecuted && (
                        <Card className="glass-card border-amber-500/50">
                            <CardHeader>
                                <CardTitle className="text-foreground">Execute Proposal</CardTitle>
                                <CardDescription>This proposal has passed and is ready to be executed. This action will trigger the on-chain instructions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleExecute} disabled={isExecutePending || !currentAccount}>
                                    <Zap className="w-5 h-5 mr-2" />
                                    {isExecutePending ? "Executing..." : "Execute Proposal"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            <Toaster/>
        </div>
    );
}