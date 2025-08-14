import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Aumenta el tiempo de espera máximo de la función a 60 segundos
export const maxDuration = 60;

// Lista de aggregators públicos de Walrus para la Testnet.
const WALRUS_AGGREGATORS = [
    'https://aggregator.testnet.walrus.atalma.io',
    'https://aggregator.walrus-testnet.h2o-nodes.com',
    'https://walrus-agg-test.bucketprotocol.io',
    'https://aggregator.walrus-testnet.walrus.space',
];

async function handler(req: NextRequest) {
  // Leemos las cabeceras personalizadas que nos envía el frontend
  const targetUrlHeader = req.headers.get('X-Walrus-Target-URL');
  const forcedContentType = req.headers.get('X-Content-Type');

  console.log('[PROXY] 1. Petición recibida.');
  console.log(`[PROXY]   - Método: ${req.method}`);
  console.log(`[PROXY]   - Target URL: ${targetUrlHeader}`);
  console.log(`[PROXY]   - Content-Type Forzado (para GET): ${forcedContentType}`);

  if (!targetUrlHeader) {
    return NextResponse.json({ error: 'Missing X-Walrus-Target-URL header' }, { status: 400 });
  }

  // --- LÓGICA PARA OBTENER IMÁGENES (GET) CON BASE64 ---
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
        
        // --- CAMBIO CLAVE: CONVERTIMOS EL BUFFER A BASE64 ---
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const contentType = forcedContentType || 'application/octet-stream';
        
        console.log(`[PROXY] 5. Imagen codificada a Base64. (Primeros 50 caracteres: ${base64Image.substring(0, 50)}...)`);

        // Devolvemos un JSON con la imagen codificada y su tipo
        return NextResponse.json({
            imageData: base64Image,
            contentType: contentType,
        });

      } catch (error: any) {
        console.warn(`[PROXY] Falló el aggregator ${aggregator}: ${error.name === 'AbortError' ? 'Timeout de 15s' : error.message}.`);
      }
    }

    console.error('[PROXY] 6. Todos los aggregators para GET fallaron.');
    return NextResponse.json({ error: 'All Walrus aggregators failed to respond.' }, { status: 504 });
  }
  
  // --- LÓGICA PARA SUBIR ARCHIVOS (POST / PUT) - SIN CAMBIOS ---
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
        return NextResponse.json(responseJson, { status: walrusResponse.status });

    } catch (error: any) {
        console.error(`[PROXY] Fallo crítico en subida:`, error);
        return NextResponse.json({ error: 'Proxy upload error', details: error.message }, { status: 500 });
    }
  }
}

export { handler as GET, handler as POST, handler as PUT };
