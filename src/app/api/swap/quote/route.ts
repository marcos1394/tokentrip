// src/app/api/swap/quote/route.ts
import { NextResponse } from 'next/server';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { normalizeStructTag } from '@mysten/sui/utils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { fromCoinType, toCoinType, amount, decimalsA, decimalsB } = await request.json();

    const sdk = initCetusSDK({ network: 'testnet' });
    await sdk.Pool.getPoolsWithPage([]); // "Calentar" el SDK

    const amountInMist = parseFloat(amount) * (10 ** decimalsA);

    const allPools = await sdk.Pool.getPoolsWithPage([]);
    if (!allPools) {
        throw new Error("getPoolsWithPage did not return any pools.");
    }
    
    const normalizedFrom = normalizeStructTag(fromCoinType);
    const normalizedTo = normalizeStructTag(toCoinType);

    const bestPool = allPools.find(p => 
        (normalizeStructTag(p.coinTypeA) === normalizedFrom && normalizeStructTag(p.coinTypeB) === normalizedTo) ||
        (normalizeStructTag(p.coinTypeA) === normalizedTo && normalizeStructTag(p.coinTypeB) === normalizedFrom)
    );

    if (!bestPool) {
      throw new Error("Cetus pool not found for this pair.");
    }

    const preswapResult = await sdk.Swap.preswap({
        pool: bestPool,
        currentSqrtPrice: bestPool.current_sqrt_price,
        coinTypeA: bestPool.coinTypeA,
        coinTypeB: bestPool.coinTypeB,
        decimalsA,
        decimalsB,
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