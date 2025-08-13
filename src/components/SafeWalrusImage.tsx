'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface SafeWalrusImageProps {
  src: string; // La URL original de Walrus que le pasaremos al proxy
  alt: string;
  className?: string;
}

export function SafeWalrusImage({ src, alt, className }: SafeWalrusImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setObjectUrl(null);
    setError(false);
    let tempUrl: string | null = null;

    if (!src) return;

    // Hacemos la petición a NUESTRA API proxy
    fetch('/api/walrus-proxy', {
      headers: {
        // Le decimos al proxy cuál es la URL real del archivo en Walrus
        'X-Walrus-Target-URL': src 
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Proxy failed with status: ${res.status}`);
        }
        return res.blob();
      })
      .then(blob => {
        // Creamos una URL local para el navegador a partir de los datos recibidos
        tempUrl = URL.createObjectURL(blob);
        setObjectUrl(tempUrl);
      })
      .catch(err => {
        console.error(`Failed to load image via proxy. Original src: ${src}`, err);
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
    return <div className={`${className} bg-muted flex items-center justify-center`}><p className="text-xs text-muted-foreground">Image Error</p></div>;
  }
  
  if (!objectUrl) {
    return <Skeleton className={className} />;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}