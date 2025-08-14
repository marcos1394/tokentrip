import { NextResponse } from 'next/server';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { normalizeStructTag } from '@mysten/sui/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { 
        poolId, 
        fromCoinType, 
        toCoinType, 
        amount, 
        fromCoinDecimals, 
        toCoinDecimals 
    } = await request.json();

    console.log('[API QUOTE] 1. Petición recibida:', { poolId, fromCoinType, toCoinType, amount });

    if (!poolId || !fromCoinType || !toCoinType || !amount) {
        throw new Error("Missing required parameters for quote API.");
    }

    const sdk = initCetusSDK({ network: 'testnet' });
    
    console.log(`[API QUOTE] 2. Buscando pool con ID: ${poolId}`);
    const pool = await sdk.Pool.getPool(poolId);
    if (!pool) {
      throw new Error(`Cetus pool with ID ${poolId} not found.`);
    }
    
    const amountInMist = new Decimal(amount).mul(new Decimal(10).pow(fromCoinDecimals));
    const a2b = normalizeStructTag(pool.coinTypeA) === normalizeStructTag(fromCoinType);

    const preswapParams = {
        pool: pool,
        currentSqrtPrice: pool.current_sqrt_price,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        decimalsA: a2b ? fromCoinDecimals : toCoinDecimals,
        decimalsB: a2b ? toCoinDecimals : fromCoinDecimals,
        a2b: a2b,
        byAmountIn: true,
        amount: amountInMist.toString(),
    };
    
    console.log('[API QUOTE] 3. Parámetros enviados a preswap:', preswapParams);

    const preswapResult = await sdk.Swap.preswap(preswapParams);
    if (!preswapResult) {
      throw new Error("Preswap did not return a valid result.");
    }

    console.log('[API QUOTE] 4. Resultado recibido de preswap:', preswapResult);
    
    // --- LA CORRECCIÓN CLAVE ESTÁ AQUÍ ---
    // Creamos una nueva respuesta que incluye los datos del preswap Y los coin_types del pool.
    const responsePayload = {
      ...preswapResult,
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
    };

    console.log('[API QUOTE] 5. Enviando respuesta completa al frontend:', responsePayload);

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error("[API QUOTE] Error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to fetch quote" }, { status: 500 });
  }
}
