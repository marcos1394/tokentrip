import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function handler(req: NextRequest) {
  const targetUrl = req.headers.get('X-Walrus-Target-URL');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing X-Walrus-Target-URL header' }, { status: 400 });
  }

  try {
    // --- LÓGICA DIFERENCIADA POR MÉTODO ---

    if (req.method === 'GET') {
      // CASO 1: Obtener una imagen para mostrarla
      console.log(`[PROXY GET] Obteniendo imagen desde: ${targetUrl}`);
      
      const walrusResponse = await fetch(targetUrl);
      if (!walrusResponse.ok) {
        return new NextResponse(await walrusResponse.text(), { status: walrusResponse.status });
      }
      
      // Descargamos la imagen completa y la enviamos con las cabeceras correctas
      const imageBuffer = await walrusResponse.arrayBuffer();
      const contentType = walrusResponse.headers.get('content-type') || 'application/octet-stream';
      
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', imageBuffer.byteLength.toString());

      return new NextResponse(imageBuffer, { status: 200, headers });

    } else {
      // CASO 2: Subir un archivo (POST o PUT)
      console.log(`[PROXY ${req.method}] Reenviando subida a: ${targetUrl}`);

      const walrusResponse = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': req.headers.get('Content-Type') || 'application/octet-stream',
        },
        body: req.body,
        // @ts-ignore - 'duplex' es necesario para el streaming en Node.js
        duplex: 'half',
      });

      if (!walrusResponse.ok) {
        const errorBody = await walrusResponse.text();
        console.error(`[PROXY] Error en subida desde Walrus (${walrusResponse.status}): ${errorBody}`);
        return new NextResponse(errorBody, { status: walrusResponse.status });
      }
      
      // Devolvemos la respuesta JSON de Walrus
      const responseJson = await walrusResponse.json();
      return NextResponse.json(responseJson, { status: walrusResponse.status });
    }

  } catch (error: any) {
    console.error('[PROXY] Fallo crítico:', error);
    return NextResponse.json({ error: 'Proxy internal error', details: error.message }, { status: 500 });
  }
}

// Exportamos el mismo handler para todos los métodos
export { handler as GET, handler as POST, handler as PUT };