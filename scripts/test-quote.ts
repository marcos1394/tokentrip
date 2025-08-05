import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Network, TurbosSdk } from 'turbos-clmm-sdk';
import { normalizeStructTag } from '@mysten/sui/utils';

// Lee el monto desde los argumentos de la línea de comandos
const amount = process.argv[2]; 
if (!amount) {
    throw new Error("Missing amount argument");
}

async function main() {
    const SUI_COIN_TYPE = '0x2::sui::SUI';
    const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
    const POOL_ID = "0x24eb5e717160b6803632074071b791987b1163ad09bd037516a06fa38d538c50";
    
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = new TurbosSdk(Network.testnet, client);
    
    const dummyAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';

    try {
        const pool = await sdk.pool.getPool(POOL_ID);
        if (!pool) throw new Error("Pool not found");

        const a2b = normalizeStructTag(pool.coin_a) === normalizeStructTag(SUI_COIN_TYPE);

        const swapResultArray = await sdk.trade.computeSwapResult({
            pools: [{ pool: pool.objectId, a2b }],
            address: dummyAddress,
            amountSpecified: amount, // Usa el monto del argumento
            amountSpecifiedIsInput: true,
        });

        if (!swapResultArray || swapResultArray.length === 0) {
            throw new Error("Turbos SDK could not compute a swap result.");
        }
        
        // Imprime el resultado como un JSON en la consola
        console.log(JSON.stringify({ ...swapResultArray[0], a2b }));

    } catch (error: any) {
        // Imprime el error como JSON para que la API pueda leerlo
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

main();