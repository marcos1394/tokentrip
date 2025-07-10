// src/components/provider/ProviderReviews.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

// --- Interfaces y Helpers ---
interface Review {
    comment: string;
    rating: number;
    reviewer: string;
    // Asumimos que el evento también podría proporcionar un timestamp
    timestamp_ms?: string; 
}

interface ProviderReviewsProps {
    reviews: Review[];
    isLoading: boolean;
}

// Helper para formatear fechas relativas
function timeAgo(timestamp?: string): string {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}


// --- Sub-componente para el estado de carga ---
function ReviewSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="glass-card">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


export function ProviderReviews({ reviews, isLoading }: ProviderReviewsProps) {
    if (isLoading) {
        return <ReviewSkeleton />;
    }

    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <MessageSquare />
                Community Reviews
            </h2>

            {!isLoading && reviews.length === 0 && (
                <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                    <MessageSquare className="w-12 h-12" />
                    <p className="text-lg font-semibold">No Reviews Yet</p>
                    <p>Be the first to leave a review after purchasing an experience!</p>
                </div>
            )}
            
            <div className="space-y-4">
                {reviews.map((review, index) => (
                    <Card key={index} className="glass-card">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor"/>
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {timeAgo(review.timestamp_ms)}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-foreground/90 italic">"{review.comment}"</p>
                            <div className="flex items-center gap-2 pt-2 border-t">
                                <Avatar className="w-6 h-6">
                                    {/* En un futuro, el avatar podría venir de un servicio de perfiles de Sui */}
                                    <AvatarFallback>{review.reviewer.slice(2, 4)}</AvatarFallback>
                                </Avatar>
                                <a 
                                    href={`https://suiscan.xyz/mainnet/account/${review.reviewer}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground font-mono hover:text-primary transition-colors"
                                >
                                    {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}