// Archivo: src/app/api/walrus-proxy/route.ts

import { NextRequest, NextResponse } from 'next/server';

async function handler(request: NextRequest) {
  const targetUrl = request.headers.get('X-Walrus-Target-URL');
  // --- CAMBIO CLAVE AQUÍ ---
  // Leemos el método original desde el encabezado que nos envía el frontend.
  const originalMethod = request.headers.get('X-Original-Method') || request.method;

  if (!targetUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing X-Walrus-Target-URL header' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`[PROXY] Reenviando solicitud a: ${targetUrl} con método: ${originalMethod}`);

    const walrusResponse = await fetch(targetUrl, {
      method: originalMethod, // <-- Usamos el método original que nos pasó el frontend
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/octet-stream',
      },
      body: request.body,
      // @ts-ignore
      duplex: 'half',
    });

    if (!walrusResponse.ok) {
      const errorBody = await walrusResponse.text();
      console.error(`[PROXY] Error desde el servidor de Walrus (${walrusResponse.status}): ${errorBody}`);
      return new NextResponse(errorBody, { status: walrusResponse.status, statusText: walrusResponse.statusText });
    }
    
    return new NextResponse(walrusResponse.body, {
      status: walrusResponse.status,
      statusText: walrusResponse.statusText,
      headers: { 'Content-Type': walrusResponse.headers.get('Content-Type') || 'application/json' },
    });

  } catch (error: any) {
    console.error('[PROXY] Fallo crítico al intentar hacer fetch:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Proxy internal error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Exportamos el mismo handler para todos los métodos que puedan llegar.
export const POST = handler;
export const PUT = handler;
export const GET = handler; // Añadimos GET por si acaso