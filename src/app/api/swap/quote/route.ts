import { NextResponse } from 'next/server';
import { Network, TurbosSdk } from 'turbos-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';
import { suiConfig } from '@/config/sui';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { fromCoinType, toCoinType, amount } = await request.json();
    const poolId = suiConfig.suiWalPoolId;

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = new TurbosSdk(Network.testnet, client);

    const amountInMist = (parseFloat(amount) * 1e9).toString();
    
    const pool = await sdk.pool.getPool(poolId);
    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }
    
    const a2b = normalizeStructTag(pool.coin_a) === normalizeStructTag(fromCoinType);

    // --- CORRECCIÓN CLAVE: Usamos una dirección 'dummy' como en el script ---
    const dummyAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';

    const swapResultArray = await sdk.trade.computeSwapResult({
        pools: [{ pool: pool.objectId, a2b }],
        address: dummyAddress, // Se usa la dirección 'dummy'
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