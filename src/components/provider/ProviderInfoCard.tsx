// src/components/provider/ProviderInfoCard.tsx
'use client';

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, User } from "lucide-react";

interface ProviderInfoCardProps {
    name: string;
    bio: string;
    imageUrl: string;
    averageRating: number;
    totalReviews: number;
}

export function ProviderInfoCard({ name, bio, imageUrl, averageRating, totalReviews }: ProviderInfoCardProps) {
    return (
        <Card className="glass-card mb-12">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <Avatar className="w-28 h-28 border-4 border-white dark:border-slate-700 shadow-lg">
                    <AvatarImage src={imageUrl} alt={name} />
                    <AvatarFallback><User size={48} /></AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <CardTitle className="text-4xl font-bold text-foreground">{name}</CardTitle>
                    <p className="text-muted-foreground mt-2 text-balance">{bio}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-6 h-6 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor"/>
                            ))}
                        </div>
                        <span className="text-muted-foreground font-semibold text-lg ml-2">{averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-sm">({totalReviews} reseñas)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}