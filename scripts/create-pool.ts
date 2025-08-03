import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Network, TurbosSdk, MIN_TICK_INDEX, MAX_TICK_INDEX } from 'turbos-clmm-sdk';
import 'dotenv/config'; // Para cargar las variables de .env

// --- CONFIGURACIÓN ---
const SUI_COIN_TYPE = '0x2::sui::SUI';
const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
const SUI_DECIMALS = 9;
const WAL_DECIMALS = 9;

// --- PARÁMETROS DE LIQUIDEZ (AJUSTADOS PARA PRUEBAS) ---
// Cantidad de SUI que quieres depositar
const SUI_AMOUNT_TO_DEPOSIT = 0.1;
// Precio inicial: ¿Cuántos WAL vale 1 SUI?
const INITIAL_PRICE_WAL_PER_SUI = 10;

async function main() {
    console.log('🚀 Initializing...');
    
    if (!process.env.PROVIDER_PRIVATE_KEY) {
        throw new Error('PROVIDER_PRIVATE_KEY is not defined in your .env file');
    }
    
    // 1. Configurar cliente y billetera
    const rawKey = Buffer.from(process.env.PROVIDER_PRIVATE_KEY, 'base64');
const secretKey = rawKey.slice(1); // Quitamos el primer byte (el 'flag' del esquema)
const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = new TurbosSdk(Network.testnet, client);
    const sender = keypair.getPublicKey().toSuiAddress();
    
    console.log(`🔑 Using address: ${sender}`);

    try {
        console.log('1/4: Calculating pool parameters...');
        
        const fees = await sdk.contract.getFees();
        if (fees.length === 0) throw new Error("Could not fetch fee tiers.");
        const fee = fees[0];

        const tickLower = MIN_TICK_INDEX;
        const tickUpper = MAX_TICK_INDEX;
        
        const sqrtPrice = sdk.math.priceToSqrtPriceX64(
            INITIAL_PRICE_WAL_PER_SUI,
            SUI_DECIMALS,
            WAL_DECIMALS
        ).toString();

        const amountA = (SUI_AMOUNT_TO_DEPOSIT * (10 ** SUI_DECIMALS)).toString();
        const [estAmountA, estAmountB] = sdk.pool.estimateAmountsFromOneAmount({
            sqrtPrice,
            tickLower,
            tickUpper,
            amount: amountA,
            isAmountA: true,
        });

        console.log(`   - Depositing approx. ${SUI_AMOUNT_TO_DEPOSIT} SUI and ${Number(estAmountB) / (10**WAL_DECIMALS)} WAL`);
        console.log('2/4: Building transaction...');

        const tx = await sdk.pool.createPool({
            fee,
            address: sender,
            tickLower,
            tickUpper,
            sqrtPrice,
            slippage: '0.1',
            coinTypeA: SUI_COIN_TYPE,
            coinTypeB: WAL_COIN_TYPE,
            amountA: estAmountA,
            amountB: estAmountB,
        });

        console.log('3/4: Signing and executing transaction...');
        
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });
        
        await client.waitForTransaction({ digest: result.digest, timeout: 120_000 });
        
        const createdPool = result.objectChanges?.find(
            (change) => change.type === 'created' && change.objectType.includes('::pool::Pool')
        );

        if (!createdPool || !('objectId' in createdPool)) {
            throw new Error("Pool was created, but its ID could not be found in the transaction response.");
        }

        console.log('✅ 4/4: Pool created successfully!');
        console.log('-------------------------------------');
        console.log('🎉 New Pool ID:', createdPool.objectId);
        console.log('-------------------------------------');

    } catch (error: any) {
        console.error('❌ Pool creation failed:', error.message);
    }
}

main();