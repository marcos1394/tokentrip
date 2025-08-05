// scripts/test-deepbook-quote.ts

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { DeepBookClient } from '@mysten/deepbook-v3';
import 'dotenv/config';

// --- IDs de Deepbook en Testnet (Verificados) ---
const SUI_COIN_TYPE = '0x2::sui::SUI';
const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
const WAL_DECIMALS = 9;

async function main() {
    const amountToSwap = 0.1; // 0.1 SUI

    console.log('🚀 Initializing DeepBookClient for Testnet...');
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    const deepbook = new DeepBookClient({
        client,
        env: 'testnet',
        address: '0x0000000000000000000000000000000000000000000000000000000000000000'
    });

    try {
        console.log(`1. Buscando el ID del pool para SUI -> WAL...`);

        const poolId = await deepbook.getPoolIdByAssets(SUI_COIN_TYPE, WAL_COIN_TYPE);
        
        if (!poolId) {
            throw new Error("Could not find a DeepBook pool for SUI/WAL. This means no one has created one yet.");
        }
        console.log(`   ✅ Pool ID encontrado: ${poolId}`);

        const amountInMist = amountToSwap * 1e9;
        console.log(`2. Obteniendo cotización para ${amountToSwap} SUI...`);
        
        const quoteResult = await deepbook.getQuoteQuantityOut(
            poolId,
            amountInMist
        );

        const amountOut = Number(quoteResult.quoteOut) / (10 ** WAL_DECIMALS);

        console.log('\n✅ ¡Cotización de Deepbook exitosa!');
        console.log('-------------------------------------');
        console.log(`   Cambiando: ${amountToSwap} SUI`);
        console.log(`   Recibirás (aprox): ${amountOut.toFixed(4)} WAL`);
        console.log('-------------------------------------');

    } catch (error: any) {
        console.error('--- ERROR DETALLADO ---', error);
    }
}

main();