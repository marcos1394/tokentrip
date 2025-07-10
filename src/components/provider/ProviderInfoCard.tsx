// src/components/provider/ProviderInfoCard.tsx
// Se ha eliminado 'use client', convirtiéndolo en un Componente de Servidor más rápido.

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, User, BadgeCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProviderInfoCardProps {
    name: string;
    bio: string;
    imageUrl: string;
    averageRating: number;
    totalReviews: number;
    isLoading: boolean; // Prop para controlar el estado de carga
    isVerified?: boolean; // Prop opcional para el distintivo de verificado
}

export function ProviderInfoCard({ name, bio, imageUrl, averageRating, totalReviews, isLoading, isVerified = true }: ProviderInfoCardProps) {
    
    // Estado de Carga (Skeleton)
    if (isLoading) {
        return (
            <Card className="glass-card mb-12">
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <Skeleton className="w-28 h-28 rounded-full" />
                    <div className="flex-grow space-y-3 w-full">
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-7 w-48 mt-2" />
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="glass-card mb-12">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <Avatar className="w-28 h-28 border-4 border-white dark:border-slate-700 shadow-lg">
                    <AvatarImage src={imageUrl} alt={name} />
                    <AvatarFallback><User size={48} /></AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <CardTitle className="text-4xl font-bold text-foreground">{name}</CardTitle>
                        {isVerified && <BadgeCheck className="w-7 h-7 text-blue-500" />}
                    </div>
                    <p className="text-muted-foreground mt-2 text-balance">{bio}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                        {totalReviews > 0 ? (
                            <>
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-6 h-6 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor"/>
                                    ))}
                                </div>
                                <span className="text-foreground font-semibold text-lg ml-2">{averageRating.toFixed(1)}</span>
                                <span className="text-muted-foreground text-sm">({totalReviews} reviews)</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground text-sm">No reviews yet</span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}