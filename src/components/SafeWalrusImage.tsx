'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface SafeWalrusImageProps {
  src: string; // La URL original de Walrus que le pasaremos al proxy
  alt: string;
  contentType: string;
  className?: string;
}

export function SafeWalrusImage({ src, alt, contentType, className }: SafeWalrusImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reseteamos el estado cada vez que las props cambian
    setDataUrl(null);
    setError(false);

    console.log(`[SafeWalrusImage] 1. useEffect activado. Recibiendo props:`, { src, contentType });

    if (!src || !contentType) {
      console.warn('[SafeWalrusImage] src o contentType están vacíos. No se hará fetch.');
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
        // --- CAMBIO CLAVE 1: Ahora esperamos una respuesta JSON ---
        return res.json();
      })
      .then(data => {
        console.log('[SafeWalrusImage] 4. Respuesta JSON recibida:', data);
        if (!data.imageData || !data.contentType) {
            throw new Error("El JSON recibido del proxy no tiene el formato esperado.");
        }
        // --- CAMBIO CLAVE 2: Construimos una `data:` URL ---
        const url = `data:${data.contentType};base64,${data.imageData}`;
        console.log(`[SafeWalrusImage] 5. URL de datos (data:) creada.`);
        setDataUrl(url);
      })
      .catch(err => {
        console.error(`[SafeWalrusImage] 6. Fallo en el proceso de fetch:`, err);
        setError(true);
      });

    // Ya no se necesita una función de limpieza para `data:` URLs

  }, [src, contentType]);

  if (error) {
    return <div className={`${className} bg-muted flex items-center justify-center`}><p className="text-xs text-muted-foreground">Image Error</p></div>;
  }
  
  if (!dataUrl) {
    return <Skeleton className={className} />;
  }

  // --- CAMBIO CLAVE 3: Usamos la nueva dataUrl en el src ---
  return <img src={dataUrl} alt={alt} className={className} />;
}
