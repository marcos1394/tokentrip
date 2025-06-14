// src/components/governance/ProposalCard.tsx
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, User, BarChart2 } from "lucide-react";

// Interfaz para los datos que recibe la tarjeta
export interface ProposalCardData {
    objectId: string;
    proposal_id: string;
    title: string;
    creator: string;
    for_votes: string;
    against_votes: string;
    end_timestamp_ms: string;
}

export function ProposalCard({ proposal }: { proposal: ProposalCardData }) {
    const params = useParams();
    const locale = params.locale as string;

    const endDate = new Date(Number(proposal.end_timestamp_ms));
    const isVotingActive = new Date() < endDate;

    // Simplificamos los votos para mostrarlos
    const forVotes = Number(proposal.for_votes) / (10 ** 9); // Asumiendo 9 decimales para TKT
    const againstVotes = Number(proposal.against_votes) / (10 ** 9);

    return (
        <Card className="glass-card card-hover flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Propuesta #{proposal.proposal_id}</span>
                    <Badge variant={isVotingActive ? "default" : "secondary"} className={isVotingActive ? "bg-green-500/20 text-green-500" : ""}>
                        {isVotingActive ? "Activa" : "Cerrada"}
                    </Badge>
                </div>
                <CardTitle className="text-foreground text-xl line-clamp-2">{proposal.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground space-y-2">
                    <p className="flex items-center gap-2"><User className="w-4 h-4"/> Creada por: {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}</p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4"/> Finaliza: {endDate.toLocaleString()}</p>
                </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
                 <div className="text-center">
                    <p className="text-sm text-green-500">A Favor</p>
                    <p className="font-bold text-lg text-foreground">{forVotes.toLocaleString()}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-sm text-red-500">En Contra</p>
                    <p className="font-bold text-lg text-foreground">{againstVotes.toLocaleString()}</p>
                 </div>
                 <Button asChild className="col-span-2 btn-sui">
                    <Link href={`/${locale}/governance/${proposal.objectId}`}>
                        <BarChart2 className="w-4 h-4 mr-2"/>
                        Ver y Votar
                    </Link>
                 </Button>
            </CardFooter>
        </Card>
    );
}