// Archivo: src/app/api/walrus-proxy/route.ts

import { NextRequest, NextResponse } from 'next/server';

async function handler(request: NextRequest) {
  const targetUrl = request.headers.get('X-Walrus-Target-URL');
  // Obtenemos el método original desde un nuevo encabezado
  const originalMethod = request.headers.get('X-Original-Method') || 'POST';

  if (!targetUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing X-Walrus-Target-URL header' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`[PROXY] Reenviando solicitud a: ${targetUrl} con método: ${originalMethod}`);

    const walrusResponse = await fetch(targetUrl, {
      method: originalMethod, // <--- Usamos el método original
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
      return new NextResponse(errorBody, { status: walrusResponse.status });
    }

    console.log(`[PROXY] Solicitud a ${targetUrl} exitosa.`);
    return new NextResponse(walrusResponse.body, { status: walrusResponse.status });

  } catch (error: any) {
    console.error('[PROXY] Fallo crítico al intentar hacer fetch:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Proxy internal error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Exportamos el mismo handler para los métodos que Walrus pueda necesitar
export const POST = handler;
export const PUT = handler;
