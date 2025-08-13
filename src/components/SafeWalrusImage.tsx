'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface SafeWalrusImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeWalrusImage({ src, alt, className }: SafeWalrusImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reseteamos el estado si la src cambia
    setObjectUrl(null);
    setError(false);
    let tempUrl: string | null = null;

    if (!src) return;

    fetch(src)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        return res.blob();
      })
      .then(blob => {
        tempUrl = URL.createObjectURL(blob);
        setObjectUrl(tempUrl);
      })
      .catch(err => {
        console.error(`Failed to load Walrus image from ${src}:`, err);
        setError(true);
      });

    // Función de limpieza para liberar memoria
    return () => {
      if (tempUrl) {
        URL.revokeObjectURL(tempUrl);
      }
    };
  }, [src]);

  if (error) {
    // Muestra un placeholder en caso de error
    return <div className={`${className} bg-muted flex items-center justify-center`}><p className="text-xs text-muted-foreground">No Image</p></div>;
  }
  
  if (!objectUrl) {
    // Muestra un esqueleto mientras carga
    return <Skeleton className={className} />;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}