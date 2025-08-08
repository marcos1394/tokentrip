// Archivo: src/app/api/walrus-proxy/route.ts

import { NextRequest, NextResponse } from 'next/server';

async function handler(request: NextRequest) {
  const targetUrl = request.headers.get('X-Walrus-Target-URL');
  const originalMethod = request.headers.get('X-Original-Method') || request.method;

  if (!targetUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing X-Walrus-Target-URL header' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`[PROXY] Reenviando a: ${targetUrl} con método: ${originalMethod}`);

    const walrusResponse = await fetch(targetUrl, {
      method: originalMethod,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/octet-stream',
      },
      body: originalMethod === 'GET' ? undefined : request.body, // Las peticiones GET no deben tener body
      // @ts-ignore
      duplex: originalMethod === 'GET' ? undefined : 'half',
    });

    if (!walrusResponse.ok) {
      const errorBody = await walrusResponse.text();
      console.error(`[PROXY] Error desde Walrus (${walrusResponse.status}): ${errorBody}`);
      return new NextResponse(errorBody, { status: walrusResponse.status });
    }
    
    return new NextResponse(walrusResponse.body, { status: walrusResponse.status });

  } catch (error: any) {
    console.error('[PROXY] Fallo crítico:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Proxy internal error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Exportamos el mismo handler para todos los métodos que el SDK pueda necesitar
export const POST = handler;
export const PUT = handler;
export const GET = handler; // <-- ESTA LÍNEA ES LA CLAVE