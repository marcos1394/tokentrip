'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface SafeWalrusImageProps {
  src: string;
  alt: string;
  contentType: string;
  className?: string;
}

export function SafeWalrusImage({ src, alt, contentType, className }: SafeWalrusImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setObjectUrl(null);
    setError(false);
    let tempUrl: string | null = null;

    console.log(`[SafeWalrusImage] 1. useEffect activado. Recibiendo props:`, { src, contentType });

    if (!src) {
      console.warn('[SafeWalrusImage] src está vacío. No se hará fetch.');
      setError(true);
      return;
    };

    console.log('[SafeWalrusImage] 2. Iniciando fetch a /api/walrus-proxy...');
    fetch('/api/walrus-proxy', {
      headers: {
        'X-Walrus-Target-URL': src,
        'X-Content-Type': contentType
      }
    })
      .then(res => {
        console.log('[SafeWalrusImage] 3. Respuesta recibida del proxy:', res);
        if (!res.ok) {
          throw new Error(`Proxy failed with status: ${res.status} ${res.statusText}`);
        }
        return res.blob();
      })
      .then(blob => {
        console.log('[SafeWalrusImage] 4. Respuesta convertida a blob:', blob);
        if (blob.size === 0) {
          console.error('[SafeWalrusImage] Error: El blob recibido del proxy está vacío.');
          throw new Error("Received empty blob from proxy.");
        }
        tempUrl = URL.createObjectURL(blob);
        console.log(`[SafeWalrusImage] 5. URL de blob creada: ${tempUrl}`);
        setObjectUrl(tempUrl);
      })
      .catch(err => {
        console.error(`[SafeWalrusImage] 6. Fallo en el proceso de fetch:`, err);
        setError(true);
      });

    return () => {
      if (tempUrl) {
        URL.revokeObjectURL(tempUrl);
      }
    };
  }, [src, contentType]);

  if (error) {
    return <div className={`${className} bg-muted flex items-center justify-center`}><p className="text-xs text-muted-foreground">Image Error</p></div>;
  }
  
  if (!objectUrl) {
    return <Skeleton className={className} />;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}
