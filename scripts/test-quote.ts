// scripts/test-quote.ts

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Network, TurbosSdk } from 'turbos-clmm-sdk';
import 'dotenv/config';

async function main() {
    // Configuración
    const SUI_COIN_TYPE = '0x2::sui::SUI';
    const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
    const POOL_ID = "0x24eb5e717160b6803632074071b791987b1163ad09bd037516a06fa38d538c50";
    
    console.log('🚀 Initializing SDK...');
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = new TurbosSdk(Network.testnet, client);
    
    // Usamos una dirección cualquiera, solo es necesaria para la simulación
    const dummyAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';

    try {
        console.log(`1. Obteniendo pool con ID: ${POOL_ID}`);
        const pool = await sdk.pool.getPool(POOL_ID);
        console.log('   ✅ Pool encontrado:', pool.objectId);

        const amountInMist = '100000000'; // 0.1 SUI
        const params = {
            pools: [{ pool: pool.objectId, a2b: true }],
            address: dummyAddress,
            amountSpecified: amountInMist,
            amountSpecifiedIsInput: true,
        };
        console.log('2. Pidiendo cotización con parámetros:', params);

        const swapResult = await sdk.trade.computeSwapResult(params);

        console.log('✅ Cotización exitosa:', swapResult);

    } catch (error) {
        console.error('--- ERROR DETALLADO ---', error);
    }
}

main();