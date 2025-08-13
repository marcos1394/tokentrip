import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// --- 1. AUMENTAMOS EL TIMEOUT TOTAL DE LA FUNCIÓN ---
// Le damos a la API hasta 60 segundos para completarse antes de que Vercel la detenga.
export const maxDuration = 60;

// Lista de aggregators públicos de Walrus para la Testnet. Si uno falla, se intentará con el siguiente.
const WALRUS_AGGREGATORS = [
    'https://aggregator.testnet.walrus.atalma.io',
    'https://aggregator.walrus-testnet.h2o-nodes.com',
    'https://walrus-agg-test.bucketprotocol.io',
    'https://aggregator.walrus-testnet.walrus.space', // El oficial de Mysten
];

async function handler(req: NextRequest) {
  const targetUrlHeader = req.headers.get('X-Walrus-Target-URL');

  if (!targetUrlHeader) {
    return NextResponse.json({ error: 'Missing X-Walrus-Target-URL header' }, { status: 400 });
  }

  // Iteramos sobre nuestra lista de aggregators
  for (let i = 0; i < WALRUS_AGGREGATORS.length; i++) {
    const aggregator = WALRUS_AGGREGATORS[i];
    // Extraemos la ruta del blob (ej. /v1/blobs/by-object-id/...) de la URL original
    const blobPath = new URL(originalTargetUrl).pathname; 
    const targetUrl = `${aggregator}${blobPath}`;

    try {
      console.log(`[PROXY] Intento #${i + 1}: Contactando a ${targetUrl}`);

      // --- 2. AUMENTAMOS EL TIMEOUT POR PETICIÓN ---
      // Le damos a cada servidor 10 segundos para responder antes de considerarlo fallido.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const walrusResponse = await fetch(targetUrl, {
          method: req.method,
          headers: {
            'Content-Type': req.headers.get('content-type') || 'application/octet-stream',
          },
          body: req.method !== 'GET' ? req.body : undefined,
          // @ts-ignore - 'duplex' es necesario para el streaming en Node.js
          duplex: req.method !== 'GET' ? 'half' : undefined,
          signal: controller.signal,
      });

      clearTimeout(timeoutId); // Si responde, cancelamos el timeout

      if (!walrusResponse.ok) {
        console.warn(`[PROXY] Aggregator ${aggregator} respondió con error ${walrusResponse.status}. Intentando el siguiente...`);
        continue; // Pasa al siguiente aggregator
      }
      
      console.log(`[PROXY] ¡Éxito con ${aggregator}! Procesando respuesta...`);
      
      const imageBuffer = await walrusResponse.arrayBuffer();
      const contentType = walrusResponse.headers.get('content-type') || 'application/octet-stream';
      
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', imageBuffer.byteLength.toString());

      // Si tenemos éxito, devolvemos la respuesta y terminamos.
      return new NextResponse(imageBuffer, { status: 200, headers });

    } catch (error: any) {
      console.warn(`[PROXY] Falló el aggregator ${aggregator}: ${error.name === 'AbortError' ? 'Timeout de 10s' : error.message}. Intentando el siguiente...`);
    }
  }

  // Si el bucle termina y ningún aggregator funcionó, devolvemos un error final.
  console.error('[PROXY] Todos los aggregators fallaron.');
  return NextResponse.json({ error: 'All Walrus aggregators failed to respond.' }, { status: 504 }); // 504 Gateway Timeout
}

// Exportamos el mismo handler para todos los métodos
export { handler as GET, handler as POST, handler as PUT };
