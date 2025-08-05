import { NextResponse } from 'next/server';
import { Network, TurbosSdk } from 'turbos-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';
import { suiConfig } from '@/config/sui';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const logs: string[] = []; // Array para guardar nuestros logs
  
  try {
    logs.push("API route started.");
    const { fromCoinType, toCoinType, amount, accountAddress } = await request.json();
    logs.push(`Request body parsed: amount=${amount}, from=${fromCoinType}, to=${toCoinType}`);
    
    const poolId = suiConfig.suiWalPoolId;
    if (!poolId) throw new Error("suiWalPoolId is not defined in suiConfig.");
    logs.push(`Using Pool ID: ${poolId}`);

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    logs.push("SuiClient initialized for testnet.");

    const sdk = new TurbosSdk(Network.testnet, client);
    logs.push("TurbosSdk initialized.");

    const amountInMist = (parseFloat(amount) * 1e9).toString();
    logs.push(`Amount in MIST calculated: ${amountInMist}`);
    
    logs.push("Attempting to fetch pool...");
    const pool = await sdk.pool.getPool(poolId);
    if (!pool) throw new Error("sdk.pool.getPool() returned null or undefined.");
    logs.push(`✅ Pool found successfully. Object ID: ${pool.objectId}`);
    
    const a2b = normalizeStructTag(pool.coin_a) === normalizeStructTag(fromCoinType);
    logs.push(`Swap direction (a2b) determined: ${a2b}`);

    const dummyAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const swapParams = {
        pools: [{ pool: pool.objectId, a2b }],
        address: dummyAddress,
        amountSpecified: amountInMist,
        amountSpecifiedIsInput: true,
    };
    logs.push(`Calling sdk.trade.computeSwapResult with params: ${JSON.stringify(swapParams)}`);

    const swapResultArray = await sdk.trade.computeSwapResult(swapParams);
    logs.push("✅ sdk.trade.computeSwapResult finished successfully.");

    if (!swapResultArray || swapResultArray.length === 0) {
        throw new Error("Turbos SDK could not compute a swap result (returned empty or invalid array).");
    }
    logs.push("Swap result array is valid and contains data.");
    
    const swapResult = swapResultArray[0];
    return NextResponse.json({ ...swapResult, a2b });

  } catch (error: any) {
    console.error("API Error caught:", error);
    // Devolvemos los logs junto con el error
    return NextResponse.json(
        { 
            error: "Failed to fetch quote",
            errorMessage: error.message,
            errorStack: error.stack,
            logs: logs // <-- Se añade el listado de logs
        }, 
        { status: 500 }
    );
  }
}