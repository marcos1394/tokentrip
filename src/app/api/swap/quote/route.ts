import { NextResponse } from 'next/server';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { normalizeStructTag } from '@mysten/sui/utils';
import Decimal from 'decimal.js';

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

    if (!poolId || !fromCoinType || !toCoinType || !amount) {
        throw new Error("Missing required parameters for quote API.");
    }

    const sdk = initCetusSDK({ network: 'testnet' });
    
    // Búsqueda de pool optimizada por ID
    const pool = await sdk.Pool.getPool(poolId);

    if (!pool) {
      throw new Error(`Cetus pool with ID ${poolId} not found.`);
    }
    
    const amountInMist = new Decimal(amount).mul(new Decimal(10).pow(fromCoinDecimals));
    const a2b = normalizeStructTag(pool.coinTypeA) === normalizeStructTag(fromCoinType);

    const preswapResult = await sdk.Swap.preswap({
        pool: pool,
        currentSqrtPrice: pool.current_sqrt_price,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        decimalsA: a2b ? fromCoinDecimals : toCoinDecimals,
        decimalsB: a2b ? toCoinDecimals : fromCoinDecimals,
        a2b: a2b,
        byAmountIn: true,
        amount: amountInMist.toString(),
    });

    if (!preswapResult) {
      throw new Error("Preswap did not return a valid result.");
    }

    return NextResponse.json(preswapResult);

  } catch (error: any) {
    console.error("[API QUOTE] Error fetching quote:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quote" }, { status: 500 });
  }
}