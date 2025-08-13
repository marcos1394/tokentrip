'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface SafeWalrusImageProps {
  src: string; // La URL original de Walrus
  alt: string;
  contentType: string; // <-- 1. AÑADIMOS LA NUEVA PROP
  className?: string;
}

export function SafeWalrusImage({ src, alt, contentType, className }: SafeWalrusImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reseteamos el estado si la src cambia
    setObjectUrl(null);
    setError(false);
    let tempUrl: string | null = null;

    if (!src) {
        setError(true);
        return;
    };

    // Hacemos la petición a NUESTRA API proxy
    fetch('/api/walrus-proxy', {
      headers: {
        'X-Walrus-Target-URL': src,
        'X-Content-Type': contentType // <-- 2. ENVIAMOS EL CONTENT-TYPE AL PROXY
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Proxy failed with status: ${res.status} ${res.statusText}`);
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
  }, [src, contentType]); // <-- 3. AÑADIMOS contentType A LAS DEPENDENCIAS

  if (error) {
    return <div className={`${className} bg-muted flex items-center justify-center`}><p className="text-xs text-muted-foreground">Image Error</p></div>;
  }
  
  if (!objectUrl) {
    return <Skeleton className={className} />;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}
