// scripts/test-cetus-quote.ts

import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';
import 'dotenv/config';

async function main() {
    // --- Configuración ---
    const SUI_COIN_TYPE = '0x2::sui::SUI';
    const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
    const SUI_DECIMALS = 9;
    const WAL_DECIMALS = 9;
    const amountToSwap = 0.1;

    console.log('🚀 Initializing Cetus SDK for Testnet...');
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = initCetusSDK({ network: 'testnet'});
    
    try {
        const amountInMist = amountToSwap * (10 ** SUI_DECIMALS);
        console.log(`1. Obteniendo todos los pools para encontrar el de SUI -> WAL...`);

        // --- CORRECCIÓN CLAVE: Usamos getPoolsWithPage y filtramos manualmente ---
        const allPools = await sdk.Pool.getPoolsWithPage([]);
        if (!allPools) {
            throw new Error("getPoolsWithPage did not return any pools.");
        }
        
        const normalizedSui = normalizeStructTag(SUI_COIN_TYPE);
        const normalizedWal = normalizeStructTag(WAL_COIN_TYPE);

        const bestPool = allPools.find(p => 
            (normalizeStructTag(p.coinTypeA) === normalizedSui && normalizeStructTag(p.coinTypeB) === normalizedWal) ||
            (normalizeStructTag(p.coinTypeA) === normalizedWal && normalizeStructTag(p.coinTypeB) === normalizedSui)
        );

        if (!bestPool) {
            throw new Error("No Cetus pools found for SUI/WAL after filtering.");
        }
        console.log(`   ✅ Pool encontrado: ${bestPool.poolAddress}`);
        
        console.log('2. Calculando cotización con preswap...');
        
        const preswapResult = await sdk.Swap.preswap({
            pool: bestPool,
            currentSqrtPrice: bestPool.current_sqrt_price,
            coinTypeA: bestPool.coinTypeA,
            coinTypeB: bestPool.coinTypeB,
            decimalsA: SUI_DECIMALS,
            decimalsB: WAL_DECIMALS,
            a2b: bestPool.coinTypeA === SUI_COIN_TYPE,
            byAmountIn: true,
            amount: amountInMist.toString(),
        });

        if (!preswapResult) {
            throw new Error("Preswap did not return a valid result.");
        }
        
        const amountOut = Number(preswapResult.estimatedAmountOut) / (10 ** WAL_DECIMALS);

        console.log('\n✅ ¡Cotización exitosa!');
        console.log('-------------------------------------');
        console.log(`   Cambiando: ${amountToSwap} SUI`);
        console.log(`   Recibirás (aprox): ${amountOut.toFixed(4)} WAL`);
        console.log('-------------------------------------');

    } catch (error: any) {
        console.error('--- ERROR DETALLADO ---', error);
    }
}

main();