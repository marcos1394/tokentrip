// src/components/provider/ProviderReviews.tsx
'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";

interface Review {
    comment: string;
    rating: number;
    reviewer: string;
}

interface ProviderReviewsProps {
    reviews: Review[];
    isLoading: boolean;
}

export function ProviderReviews({ reviews, isLoading }: ProviderReviewsProps) {
    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <MessageSquare />
                Opiniones de los Viajeros
            </h2>
            {isLoading && <p className="text-muted-foreground">Cargando reseñas...</p>}
            {!isLoading && reviews.length === 0 && (
                <p className="text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">Este proveedor aún no tiene reseñas.</p>
            )}
            {reviews.map((review, index) => (
                <Card key={index} className="glass-card">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor"/>
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Opinión de: {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-foreground italic">"{review.comment}"</p>
                    </CardContent>
                </Card>
            ))}
        </section>
    );
}