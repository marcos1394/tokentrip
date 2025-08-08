// Archivo: src/app/api/walrus-proxy/route.ts

import { NextRequest, NextResponse } from 'next/server';

async function handler(request: NextRequest) {
  // Obtenemos la URL de destino que nuestro frontend nos envió en un encabezado.
  const targetUrl = request.headers.get('X-Walrus-Target-URL');
  
  // Obtenemos el método HTTP original (PUT, POST, etc.)
  const originalMethod = request.method;

  if (!targetUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing X-Walrus-Target-URL header' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`[PROXY] Reenviando solicitud a: ${targetUrl} con método: ${originalMethod}`);

    // Hacemos la llamada 'fetch' desde nuestro servidor al servidor de Walrus.
    // Esto no tiene restricciones de CORS.
    const walrusResponse = await fetch(targetUrl, {
      method: originalMethod,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/octet-stream',
      },
      body: request.body,
      // @ts-ignore - 'duplex' es necesario para reenviar streams de datos en entornos como Vercel.
      duplex: 'half',
    });

    // Si la respuesta de Walrus es un error, lo registramos y lo reenviamos al frontend.
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
      headers: {
        'Content-Type': walrusResponse.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error: any) {
    console.error('[PROXY] Fallo crítico al intentar hacer fetch:', {
        errorMessage: error.message,
        errorCause: error.cause,
        errorStack: error.stack,
    });
    return new NextResponse(
      JSON.stringify({ error: 'Proxy internal error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Exportamos el mismo handler para los métodos que Walrus pueda necesitar (POST y PUT).
export const POST = handler;
export const PUT = handler;
