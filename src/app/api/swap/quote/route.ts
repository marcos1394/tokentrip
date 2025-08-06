// src/app/api/swap/quote/route.ts
import { NextResponse } from 'next/server';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { normalizeStructTag } from '@mysten/sui/utils'; // Asegúrate de importar esto

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { fromCoinType, toCoinType, amount, decimalsA, decimalsB } = await request.json();

    console.log('[API QUOTE] Request received:', { fromCoinType, toCoinType, amount, decimalsA, decimalsB });

    const sdk = initCetusSDK({ network: 'testnet' });
    
    // No es necesario llamar dos veces a getPoolsWithPage
    console.log('[API QUOTE] Fetching pools...');
    const allPools = await sdk.Pool.getPoolsWithPage([]);
    
    if (!allPools || allPools.length === 0) {
        throw new Error("No pools found.");
    }
    
    const normalizedFrom = normalizeStructTag(fromCoinType);
    const normalizedTo = normalizeStructTag(toCoinType);

    console.log('[API QUOTE] Searching for pool:', { normalizedFrom, normalizedTo });
    
    // Buscar el mejor pool
    const bestPool = allPools.find(p => {
        const normA = normalizeStructTag(p.coinTypeA);
        const normB = normalizeStructTag(p.coinTypeB);
        const match = (normA === normalizedFrom && normB === normalizedTo) ||
                      (normA === normalizedTo && normB === normalizedFrom);
        console.log('[API QUOTE] Checking pool:', { poolAddress: p.poolAddress, normA, normB, match });
        return match;
    });

    if (!bestPool) {
      throw new Error(`Cetus pool not found for pair ${fromCoinType} -> ${toCoinType}.`);
    }

    console.log('[API QUOTE] Pool found:', bestPool.poolAddress);

    // Convertir amount
    const amountInMist = parseFloat(amount) * Math.pow(10, decimalsA);
    console.log('[API QUOTE] Amount in mist:', amountInMist);

    // Calcular a2b correctamente usando tipos normalizados
    const normalizedPoolCoinA = normalizeStructTag(bestPool.coinTypeA);
    const a2b = normalizedPoolCoinA === normalizedFrom; // TRUE si fromCoinType es coinTypeA

    console.log('[API QUOTE] Swap direction (a2b):', a2b);

    // Determinar decimales correctamente
    const preswapDecimalsA = normalizedPoolCoinA === normalizedFrom ? decimalsA : decimalsB;
    const preswapDecimalsB = normalizedPoolCoinA === normalizedFrom ? decimalsB : decimalsA;

    console.log('[API QUOTE] Preswap decimals:', { preswapDecimalsA, preswapDecimalsB });

    // Realizar preswap
    const preswapParams = {
        pool: bestPool,
        currentSqrtPrice: bestPool.current_sqrt_price,
        coinTypeA: bestPool.coinTypeA, // Usar directamente del pool
        coinTypeB: bestPool.coinTypeB, // Usar directamente del pool
        decimalsA: preswapDecimalsA,   // Decimales correctos
        decimalsB: preswapDecimalsB,   // Decimales correctos
        a2b: a2b,                      // Calculado correctamente
        byAmountIn: true,
        amount: amountInMist.toString(),
    };

    console.log('[API QUOTE] Preswap params:', preswapParams);

    const preswapResult = await sdk.Swap.preswap(preswapParams);

    if (!preswapResult) {
      throw new Error("Preswap did not return a valid result.");
    }

    console.log('[API QUOTE] Preswap result:', preswapResult);

    return NextResponse.json(preswapResult);

  } catch (error: any) {
    console.error("[API QUOTE] Cetus API Error fetching quote:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quote" }, { status: 500 });
  }
}
