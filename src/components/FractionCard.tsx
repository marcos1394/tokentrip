// src/components/FractionCard.tsx
// Se ha eliminado 'use client' porque no se necesitan hooks.
// Este ahora es un Componente de Servidor, lo que lo hace más rápido.
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import { Percent, Layers } from 'lucide-react';

interface FractionCardProps {
    parentId: string;
    share: number;
    parentName: string;
    parentImageUrl: string;
}

export function FractionCard({ parentId, share, parentName, parentImageUrl }: FractionCardProps) {
    // El enlace ahora es estático, sin el 'locale'
    const targetUrl = `/experience/${parentId}`;
    
    return (
        <Link href={targetUrl} className="group block h-full">
            <Card className="glass-card card-hover h-full flex flex-col overflow-hidden">
                <div className="aspect-video overflow-hidden">
                    <img 
                        src={parentImageUrl} 
                        alt={parentName} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                </div>
                <CardContent className="p-4 flex-grow">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Layers className="w-4 h-4"/>
                        <span>NFT Share</span>
                    </div>
                    <h3 className="font-bold text-lg text-foreground line-clamp-2 h-[56px]">{parentName}</h3>
                </CardContent>
                <CardFooter className="p-4 bg-muted/20 border-t">
                    <div className="flex items-center text-primary font-bold text-xl">
                        <Percent className="w-5 h-5 mr-2"/>
                        <span>{share}% Ownership</span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}