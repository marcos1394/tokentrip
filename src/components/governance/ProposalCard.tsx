// src/components/governance/ProposalCard.tsx
// Se ha eliminado 'use client', convirtiéndolo en un Componente de Servidor más rápido.
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Clock, User, BarChart2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// --- Interfaces y Helpers ---

export interface ProposalCardData {
    objectId: string;
    proposal_id: string;
    title: string;
    creator: string;
    for_votes: string;
    against_votes: string;
    end_timestamp_ms: string;
    is_executed: boolean; // Se añade para un estado más preciso
}

// Helper para formatear fechas relativas
function formatTime(timestamp_ms: string): string {
    const endDate = new Date(Number(timestamp_ms));
    const now = new Date();
    const seconds = Math.floor((endDate.getTime() - now.getTime()) / 1000);

    if (seconds <= 0) return "Ended";

    let interval = seconds / 31536000;
    if (interval > 1) return `Ends in ${Math.floor(interval)} years`;
    interval = seconds / 2592000;
    if (interval > 1) return `Ends in ${Math.floor(interval)} months`;
    interval = seconds / 86400;
    if (interval > 1) return `Ends in ${Math.floor(interval)} days`;
    interval = seconds / 3600;
    if (interval > 1) return `Ends in ${Math.floor(interval)} hours`;
    interval = seconds / 60;
    if (interval > 1) return `Ends in ${Math.floor(interval)} minutes`;
    return `Ends in ${Math.floor(seconds)} seconds`;
}

// --- Componente Principal ---

export function ProposalCard({ proposal }: { proposal: ProposalCardData }) {
    
    // --- Lógica y Cálculos ---
    const endDate = new Date(Number(proposal.end_timestamp_ms));
    const isVotingActive = new Date() < endDate && !proposal.is_executed;
    
    // Se usan BigInt para todos los cálculos para evitar errores de precisión
    const forVotes = BigInt(proposal.for_votes);
    const againstVotes = BigInt(proposal.against_votes);
    const totalVotes = forVotes + againstVotes;
    
    const forPercentage = totalVotes > 0n ? Number((forVotes * 100n) / totalVotes) : 0;

    const status = proposal.is_executed ? 'Executed' : (isVotingActive ? 'Active' : 'Closed');

    return (
        <Card className="glass-card card-hover flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Proposal #{proposal.proposal_id}</span>
                    <Badge 
                        variant={status === 'Active' ? 'default' : 'secondary'} 
                        className={status === 'Active' ? "bg-green-500/20 text-green-500 border-green-500/30" : (status === 'Executed' ? "bg-blue-500/20 text-blue-500 border-blue-500/30" : "")}
                    >
                        {status}
                    </Badge>
                </div>
                <CardTitle className="text-foreground text-xl line-clamp-2 h-[56px]">{proposal.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="text-xs text-muted-foreground space-y-2">
                    <p className="flex items-center gap-2"><User className="w-4 h-4"/> Proposed by: <span className="font-mono">{proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}</span></p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4"/> {formatTime(proposal.end_timestamp_ms)}</p>
                </div>
                {/* Barra de Progreso Visual */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-green-500">For ({forPercentage.toFixed(1)}%)</span>
                        <span className="font-medium text-red-500">Against ({(100 - forPercentage).toFixed(1)}%)</span>
                    </div>
                    <Progress value={forPercentage} className="h-2" />
                </div>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full btn-sui">
                    <Link href={`/governance/${proposal.objectId}`}>
                        <BarChart2 className="w-4 h-4 mr-2"/>
                        View & Vote
                    </Link>
                 </Button>
            </CardFooter>
        </Card>
    );
}