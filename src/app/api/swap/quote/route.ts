// src/app/api/swap/quote/route.ts
export const runtime = 'nodejs'; 

import { NextResponse } from 'next/server';
import { Network, TurbosSdk } from 'turbos-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';
import { suiConfig } from '@/config/sui';

// --- LÍNEA CLAVE ---
// Le dice a Vercel que ejecute esta ruta en el entorno completo de Node.js

export async function POST(request: Request) {
  try {
    const { fromCoinType, toCoinType, amount, accountAddress } = await request.json();
    const poolId = suiConfig.suiWalPoolId; // Se obtiene del config

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = new TurbosSdk(Network.testnet, client);

    const amountInMist = (parseFloat(amount) * 1e9).toString();
    
    const pool = await sdk.pool.getPool(poolId);
    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }
    
    const a2b = normalizeStructTag(pool.coin_a) === normalizeStructTag(fromCoinType);

    const swapResultArray = await sdk.trade.computeSwapResult({
        pools: [{ pool: pool.objectId, a2b }],
        address: accountAddress,
        amountSpecified: amountInMist,
        amountSpecifiedIsInput: true,
    });

    if (!swapResultArray || swapResultArray.length === 0) {
        throw new Error("Turbos SDK could not compute a swap result.");
    }

    const swapResult = swapResultArray[0];
    
    return NextResponse.json({ ...swapResult, a2b });

  } catch (error: any) {
    console.error("API Error fetching quote:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quote" }, { status: 500 });
  }
}