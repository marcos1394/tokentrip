import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';

// Interfaz actualizada para recibir contentType
interface ExperienceNftCardProps {
    listingId?: string;
    nftId: string;
    name: string;
    imageUrl: string;
    contentType: string;
    price?: number;
    currency?: 'SUI' | 'TKT';
}

export function ExperienceNftCard({ 
    nftId, 
    name, 
    imageUrl, 
    contentType,
    price, 
    currency = 'SUI', 
    listingId 
}: ExperienceNftCardProps) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const targetUrl = `/es/experience/${listingId || nftId}`;
    const isImage = contentType.startsWith("image/");
    const isVideo = contentType.startsWith("video/");

    const handleImageLoad = () => {
        setIsLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
        console.error('Error loading image from Walrus:', imageUrl);
    };

    return (
        <Link href={targetUrl} className="group block h-full">
            <Card className="glass-card card-hover h-full flex flex-col overflow-hidden">
                <CardHeader className="p-0">
                    <div className="aspect-video overflow-hidden bg-muted relative">
                        {isImage && (
                            <>
                                {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                        <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
                                    </div>
                                )}
                                
                                <img 
                                    src={imageUrl}
                                    alt={name}
                                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                                        isLoading ? 'opacity-0' : 'opacity-100'
                                    }`}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                    crossOrigin="anonymous"
                                />
                                
                                {imageError && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                        <div className="text-center p-4">
                                            <p className="text-xs text-muted-foreground mb-2">Image not available</p>
                                            <p className="text-xs text-muted-foreground opacity-70">
                                                Check blob ID or network connection
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {isVideo && (
                            <video 
                                src={imageUrl}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                controls={false}
                                muted
                                loop
                                playsInline
                                onError={handleImageError}
                            />
                        )}
                        
                        {!isImage && !isVideo && (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center p-4">
                                    <p className="text-xs text-muted-foreground mb-1">Media type: {contentType}</p>
                                    <p className="text-xs text-muted-foreground">Preview not available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-lg text-foreground line-clamp-2 leading-tight h-[56px]">{name}</CardTitle>
                </CardContent>
                
                {price !== undefined && (
                    <CardFooter className="p-4 bg-muted/20 border-t">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Price</span>
                                <span className="text-xl font-bold text-foreground">
                                    {price.toLocaleString('en-US', { maximumFractionDigits: 2 })} {currency}
                                </span>
                            </div>
                            <Badge className="bg-primary/90 text-primary-foreground">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                <span className="font-semibold">Buy Now</span>
                            </Badge>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
}
