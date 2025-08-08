// Archivo: src/app/api/walrus-proxy/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const targetUrl = request.headers.get('X-Walrus-Target-URL');

  if (!targetUrl) {
    return new NextResponse('Missing X-Walrus-Target-URL header', { status: 400 });
  }

  try {
    const walrusResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/octet-stream',
      },
      body: request.body,
    });

    if (!walrusResponse.ok) {
      const errorBody = await walrusResponse.text();
      console.error(`Error from Walrus server (${walrusResponse.status}): ${errorBody}`);
      return new NextResponse(errorBody, {
        status: walrusResponse.status,
        statusText: walrusResponse.statusText,
      });
    }
    
    // Devolvemos la respuesta exitosa de Walrus a nuestro frontend
    return new NextResponse(walrusResponse.body, {
      status: walrusResponse.status,
      statusText: walrusResponse.statusText,
      headers: { 'Content-Type': walrusResponse.headers.get('Content-Type') || 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in walrus-proxy:', error);
    return new NextResponse(JSON.stringify({ error: 'Proxy internal error' }), { status: 500 });
  }
}
