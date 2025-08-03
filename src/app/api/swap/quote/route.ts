// src/app/api/swap/quote/route.ts

import { NextResponse } from 'next/server';
import { Network, TurbosSdk } from 'turbos-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';

export async function POST(request: Request) {
  try {
    const { fromCoinType, toCoinType, amount, accountAddress, poolId } = await request.json();

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = new TurbosSdk(Network.testnet, client);

    const amountInMist = (parseFloat(amount) * 1e9).toString();
    
    const pool = await sdk.pool.getPool(poolId);
    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }
    
    const a2b = normalizeStructTag(pool.coin_a) === normalizeStructTag(fromCoinType);

    const [swapResult] = await sdk.trade.computeSwapResult({
        pools: [{ pool: pool.objectId, a2b }],
        address: accountAddress,
        amountSpecified: amountInMist,
        amountSpecifiedIsInput: true,
    });
    
    return NextResponse.json({ ...swapResult, a2b });

  } catch (error: any) {
    console.error("API Error fetching quote:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quote" }, { status: 500 });
  }
}