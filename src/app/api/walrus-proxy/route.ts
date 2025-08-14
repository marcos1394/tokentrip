import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 segundos de timeout total

const WALRUS_AGGREGATORS = [
    'https://aggregator.testnet.walrus.atalma.io',
    'https://aggregator.walrus-testnet.h2o-nodes.com',
    'https://walrus-agg-test.bucketprotocol.io',
    'https://aggregator.walrus-testnet.walrus.space',
];

async function handler(req: NextRequest) {
  const targetUrlHeader = req.headers.get('X-Walrus-Target-URL');
  const forcedContentType = req.headers.get('X-Content-Type');

  console.log('[PROXY] 1. Petición recibida.');
  console.log(`[PROXY]   - Método: ${req.method}`);
  console.log(`[PROXY]   - Target URL: ${targetUrlHeader}`);
  console.log(`[PROXY]   - Content-Type Forzado (para GET): ${forcedContentType}`);

  if (!targetUrlHeader) {
    return new Response(JSON.stringify({ error: 'Missing X-Walrus-Target-URL header' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // --- LÓGICA PARA OBTENER IMÁGENES (GET) ---
  if (req.method === 'GET') {
    for (const [index, aggregator] of WALRUS_AGGREGATORS.entries()) {
      const blobPath = new URL(targetUrlHeader).pathname;
      const targetUrl = `${aggregator}${blobPath}`;

      try {
        console.log(`[PROXY GET] 2. Intento #${index + 1}: Contactando a ${aggregator}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout por intento

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
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Content-Type', forcedContentType || 'application/octet-stream');
        headers.set('Content-Length', imageBuffer.byteLength.toString());

        console.log('[PROXY] 5. Enviando respuesta al cliente con cabeceras:', {
          'Content-Type': headers.get('Content-Type'),
          'Content-Length': headers.get('Content-Length'),
        });
        
        // --- CORRECCIÓN FINAL: Usamos el `Response` estándar para mayor fiabilidad ---
        return new Response(imageBuffer, { status: 200, headers });

      } catch (error: any) {
        console.warn(`[PROXY] Falló el aggregator ${aggregator}: ${error.name === 'AbortError' ? 'Timeout de 15s' : error.message}.`);
      }
    }

    console.error('[PROXY] 6. Todos los aggregators para GET fallaron.');
    return new Response(JSON.stringify({ error: 'All Walrus aggregators failed to respond.' }), { status: 504, headers: { 'Content-Type': 'application/json' } });
  }
  
  // --- LÓGICA PARA SUBIR ARCHIVOS (POST / PUT) ---
  else {
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
        console.log(`[PROXY ${req.method}] Éxito en la subida.`);
        // Usamos NextResponse aquí porque sabemos que la respuesta es JSON
        return NextResponse.json(responseJson, { status: walrusResponse.status });

    } catch (error: any) {
        console.error(`[PROXY] Fallo crítico en subida:`, error);
        return NextResponse.json({ error: 'Proxy upload error', details: error.message }, { status: 500 });
    }
  }
}

export { handler as GET, handler as POST, handler as PUT };
