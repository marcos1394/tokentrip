// src/app/api/swap/quote/route.ts
import { NextResponse } from 'next/server';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { fromCoinType, toCoinType, amount, decimalsA, decimalsB } = await request.json();

    const sdk = initCetusSDK({ network: 'testnet' });
    // La línea 'await sdk.build()' se ha eliminado.

    const amountInMist = parseFloat(amount) * (10 ** decimalsA);

    const pools = await sdk.Pool.getPoolByCoins([fromCoinType, toCoinType]);
    if (!pools || pools.length === 0) {
      throw new Error("Cetus pool not found for this pair.");
    }
    const bestPool = pools[0];

    const preswapResult = await sdk.Swap.preswap({
        pool: bestPool,
        currentSqrtPrice: bestPool.current_sqrt_price,
        coinTypeA: bestPool.coinTypeA,
        coinTypeB: bestPool.coinTypeB,
        decimalsA: decimalsA,
        decimalsB: decimalsB,
        a2b: bestPool.coinTypeA === fromCoinType,
        byAmountIn: true,
        amount: amountInMist.toString(),
    });

    if (!preswapResult) {
      throw new Error("Preswap did not return a valid result.");
    }

    return NextResponse.json(preswapResult);

  } catch (error: any) {
    console.error("Cetus API Error fetching quote:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quote" }, { status: 500 });
  }
}