// Archivo: src/app/api/walrus-proxy/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const targetUrl = request.headers.get('X-Walrus-Target-URL');

  if (!targetUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing X-Walrus-Target-URL header' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // --- INICIA EL NUEVO MANEJO DE ERRORES ---
  try {
    console.log(`[PROXY] Reenviando solicitud a: ${targetUrl}`);

    // Copiamos los encabezados y el cuerpo de la solicitud original.
    // Usamos 'duplex: 'half'' que a veces es necesario para reenviar cuerpos de solicitud (streams).
    const walrusResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/octet-stream',
      },
      body: request.body,
      // @ts-ignore - 'duplex' es una opción válida en algunos entornos de servidor como Node.js
      duplex: 'half', 
    });

    // Si la respuesta de Walrus es un error, lo registramos y lo reenviamos.
    if (!walrusResponse.ok) {
      const errorBody = await walrusResponse.text();
      console.error(`[PROXY] Error desde el servidor de Walrus (${walrusResponse.status}): ${errorBody}`);
      return new NextResponse(errorBody, {
        status: walrusResponse.status,
        statusText: walrusResponse.statusText,
      });
    }
    
    console.log(`[PROXY] Solicitud a ${targetUrl} exitosa.`);
    
    // Reenviamos la respuesta exitosa de Walrus de vuelta a nuestro frontend.
    return new NextResponse(walrusResponse.body, {
      status: walrusResponse.status,
      statusText: walrusResponse.statusText,
      headers: { 'Content-Type': walrusResponse.headers.get('Content-Type') || 'application/json' },
    });

  } catch (error: any) {
    // ESTE ES EL BLOQUE MÁS IMPORTANTE
    // Si el 'fetch' falla por cualquier razón (red, SSL, etc.), lo veremos aquí.
    console.error('[PROXY] Fallo crítico al intentar hacer fetch:', {
        errorMessage: error.message,
        errorCause: error.cause, // 'cause' a menudo contiene el error de red subyacente
        errorStack: error.stack,
    });

    // Enviamos un error más descriptivo al frontend.
    return new NextResponse(
        JSON.stringify({ 
            error: 'Proxy internal error', 
            details: `Failed to fetch from target: ${error.message}` 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
