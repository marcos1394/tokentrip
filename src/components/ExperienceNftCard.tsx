import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import Link from 'next/link';
import { useState, useEffect } from 'react';

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
    const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
    
    const targetUrl = `/es/experience/${listingId || nftId}`;
    const isImage = contentType.startsWith("image/");
    const isVideo = contentType.startsWith("video/");

    // Función para procesar URLs de Walrus y convertirlas a blob URLs
    useEffect(() => {
        const processWalrusUrl = async () => {
            if (!imageUrl || !isImage) {
                setProcessedImageUrl(imageUrl);
                return;
            }

            // Si es una URL del agregador de Walrus, convertir a blob URL
            if (imageUrl.includes('aggregator.testnet.walrus.atalma.io/v1/blobs/')) {
                try {
                    console.log('🔄 Procesando URL de Walrus:', imageUrl);
                    
                    const response = await fetch(imageUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const arrayBuffer = await response.arrayBuffer();
                    const blob = new Blob([arrayBuffer], { 
                        type: contentType || 'image/png' 
                    });
                    
                    const blobUrl = URL.createObjectURL(blob);
                    setProcessedImageUrl(blobUrl);
                    
                    console.log('✅ Blob URL creada para imagen de Walrus');
                    
                    // Cleanup function para liberar la URL cuando el componente se desmonte
                    return () => {
                        URL.revokeObjectURL(blobUrl);
                    };
                    
                } catch (error) {
                    console.error('❌ Error procesando URL de Walrus:', error);
                    setProcessedImageUrl(imageUrl); // Fallback a la URL original
                }
            } else {
                setProcessedImageUrl(imageUrl);
            }
        };

        processWalrusUrl();
    }, [imageUrl, contentType, isImage]);

    const handleImageLoad = () => {
        setIsLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
        console.error('Error loading image:', processedImageUrl);
        
        // Log para debugging
        if (imageUrl.includes('by-object-id')) {
            console.log('💡 Tip: La URL usa Object ID, necesitas el Blob ID');
        } else if (imageUrl.includes('aggregator')) {
            console.log('💡 Tip: Error con URL del agregador, verificar conectividad');
        }
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
                                    src={processedImageUrl}
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
                                src={processedImageUrl}
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
