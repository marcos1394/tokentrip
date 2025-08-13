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
  // Guardamos la URL original que nos envía el cliente
  const targetUrlHeader = req.headers.get('X-Walrus-Target-URL');

  if (!targetUrlHeader) {
    return NextResponse.json({ error: 'Missing X-Walrus-Target-URL header' }, { status: 400 });
  }

  // Iteramos sobre nuestra lista de aggregators
  for (let i = 0; i < WALRUS_AGGREGATORS.length; i++) {
    const aggregator = WALRUS_AGGREGATORS[i];
    
    // --- CORRECCIÓN DEL TYPO AQUÍ ---
    // Usamos `targetUrlHeader` para construir la nueva URL
    const blobPath = new URL(targetUrlHeader).pathname; 
    const targetUrl = `${aggregator}${blobPath}`;

    try {
      console.log(`[PROXY] Intento #${i + 1}: Contactando a ${targetUrl} con método ${req.method}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const walrusResponse = await fetch(targetUrl, {
          method: req.method,
          headers: {
            'Content-Type': req.headers.get('content-type') || 'application/octet-stream',
          },
          body: req.method === 'GET' ? undefined : req.body,
          // @ts-ignore - 'duplex' es necesario para el streaming en Node.js
          duplex: req.method !== 'GET' ? 'half' : undefined,
          signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!walrusResponse.ok) {
        console.warn(`[PROXY] Aggregator ${aggregator} respondió con error ${walrusResponse.status}. Intentando el siguiente...`);
        continue;
      }
      
      console.log(`[PROXY] ¡Éxito con ${aggregator}!`);
      
      // Si es una petición GET, procesamos la imagen
      if (req.method === 'GET') {
        const imageBuffer = await walrusResponse.arrayBuffer();
        const contentType = walrusResponse.headers.get('content-type') || 'application/octet-stream';
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Length', imageBuffer.byteLength.toString());
        return new NextResponse(imageBuffer, { status: 200, headers });
      } 
      // Si es POST o PUT, devolvemos el JSON de la respuesta
      else {
        const responseJson = await walrusResponse.json();
        return NextResponse.json(responseJson, { status: walrusResponse.status });
      }

    } catch (error: any) {
      console.warn(`[PROXY] Falló el aggregator ${aggregator}: ${error.name === 'AbortError' ? 'Timeout de 10s' : error.message}. Intentando el siguiente...`);
    }
  }

  console.error('[PROXY] Todos los aggregators fallaron.');
  return NextResponse.json({ error: 'All Walrus aggregators failed to respond.' }, { status: 504 });
}

export { handler as GET, handler as POST, handler as PUT };
