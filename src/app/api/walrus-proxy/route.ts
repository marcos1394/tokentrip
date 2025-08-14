import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Aumenta el tiempo de espera máximo de la función a 30 segundos
export const maxDuration = 30;

// Lista de aggregators públicos de Walrus para la Testnet.
const WALRUS_AGGREGATORS = [
    'https://aggregator.testnet.walrus.atalma.io',
    'https://aggregator.walrus-testnet.h2o-nodes.com',
    'https://walrus-agg-test.bucketprotocol.io',
    'https://aggregator.walrus-testnet.walrus.space',
];

async function handler(req: NextRequest) {
  // Leemos las cabeceras que nos envía el frontend
  const targetUrlHeader = req.headers.get('X-Walrus-Target-URL');
  const forcedContentType = req.headers.get('X-Content-Type'); // La cabecera clave

  console.log('[PROXY] 1. Petición recibida.');
  console.log(`[PROXY]   - Target URL: ${targetUrlHeader}`);
  console.log(`[PROXY]   - Content-Type Forzado: ${forcedContentType}`);

  if (!targetUrlHeader) {
    return NextResponse.json({ error: 'Missing X-Walrus-Target-URL header' }, { status: 400 });
  }

  // --- LÓGICA PARA SUBIR ARCHIVOS (POST / PUT) ---
  if (req.method !== 'GET') {
    console.log(`[PROXY ${req.method}] Reenviando subida a: ${targetUrlHeader}`);
    try {
        const walrusResponse = await fetch(targetUrlHeader, {
            method: req.method,
            headers: { 'Content-Type': req.headers.get('Content-Type') || 'application/octet-stream' },
            body: req.body,
            // @ts-ignore - 'duplex' es necesario para el streaming en Node.js
            duplex: 'half',
        });

        if (!walrusResponse.ok) {
            const errorBody = await walrusResponse.text();
            throw new Error(`Walrus upload failed with status ${walrusResponse.status}: ${errorBody}`);
        }
        
        const responseJson = await walrusResponse.json();
        return NextResponse.json(responseJson, { status: walrusResponse.status });

    } catch (error: any) {
        console.error(`[PROXY] Fallo crítico en subida:`, error);
        return NextResponse.json({ error: 'Proxy upload error', details: error.message }, { status: 500 });
    }
  }
  
  // --- LÓGICA PARA OBTENER IMÁGENES (GET) ---
  for (const aggregator of WALRUS_AGGREGATORS) {
    const blobPath = new URL(targetUrlHeader).pathname;
    const targetUrl = `${aggregator}${blobPath}`;

    try {
      console.log(`[PROXY GET] 2. Intentando con aggregator: ${targetUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const walrusResponse = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!walrusResponse.ok) {
        console.warn(`[PROXY] Aggregator ${aggregator} respondió con error ${walrusResponse.status}.`);
        continue;
      }
      
      console.log(`[PROXY] 3. ¡Éxito con ${aggregator}!`);
      const imageBuffer = await walrusResponse.arrayBuffer();
      console.log(`[PROXY] 4. Buffer de imagen descargado. Tamaño: ${imageBuffer.byteLength} bytes.`);
      
      const headers = new Headers();
      // --- ESTA ES LA LÍNEA MÁS IMPORTANTE ---
      // Forzamos el Content-Type que nos envió el frontend.
      headers.set('Content-Type', forcedContentType || 'application/octet-stream');
      headers.set('Content-Length', imageBuffer.byteLength.toString());

      console.log('[PROXY] 5. Enviando respuesta al cliente con cabeceras:', {
        'Content-Type': headers.get('Content-Type'),
        'Content-Length': headers.get('Content-Length'),
      });

      return new NextResponse(imageBuffer, { status: 200, headers });

    } catch (error: any) {
      console.warn(`[PROXY] Falló el aggregator ${aggregator}: ${error.name === 'AbortError' ? 'Timeout' : error.message}.`);
    }
  }

  console.error('[PROXY] 6. Todos los aggregators fallaron.');
  return NextResponse.json({ error: 'All Walrus aggregators failed to respond.' }, { status: 504 });
}

export { handler as GET, handler as POST, handler as PUT };
