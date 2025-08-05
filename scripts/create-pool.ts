// scripts/create-cetus-pool.ts

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { 
    initCetusSDK, 
    TickMath, 
    ClmmPoolUtil 
} from '@cetusprotocol/cetus-sui-clmm-sdk';
import BN from 'bn.js';
import 'dotenv/config';
import Decimal from 'decimal.js'; // <-- Se importa Decimal

// --- CONFIGURACIÓN ---
const SUI_COIN_TYPE = '0x2::sui::SUI';
const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
const SUI_DECIMALS = 9;
const WAL_DECIMALS = 9;

// --- PARÁMETROS DE LIQUIDEZ ---
const SUI_AMOUNT_TO_DEPOSIT = 0.1;
const INITIAL_PRICE_WAL_PER_SUI = 0.5;

async function main() {
    console.log('🚀 Initializing...');
    if (!process.env.PROVIDER_PRIVATE_KEY) {
        throw new Error('PROVIDER_PRIVATE_KEY is not defined in your .env file');
    }

    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(process.env.PROVIDER_PRIVATE_KEY, 'base64').slice(1));
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    // --- CORRECCIÓN 1: Se usa la inicialización correcta ---
    const sdk = initCetusSDK({
        network: 'testnet',
        fullNodeUrl: getFullnodeUrl('testnet'),
    });
    sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
    
    console.log(`🔑 Using address: ${sdk.senderAddress}`);

    try {
        console.log('1/4: Calculating pool parameters...');
        
        const tick_spacing = 60;
        const initialize_sqrt_price = TickMath.priceToSqrtPriceX64(new Decimal(INITIAL_PRICE_WAL_PER_SUI), SUI_DECIMALS, WAL_DECIMALS).toString();
        const current_tick_index = TickMath.sqrtPriceX64ToTickIndex(new BN(initialize_sqrt_price));
        const tick_lower = TickMath.getPrevInitializableTickIndex(current_tick_index, tick_spacing);
        const tick_upper = TickMath.getNextInitializableTickIndex(current_tick_index, tick_spacing);

        const fix_coin_amount = new BN(SUI_AMOUNT_TO_DEPOSIT * (10 ** SUI_DECIMALS));
        const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
            tick_lower, tick_upper, fix_coin_amount, true, true, 0.01, new BN(initialize_sqrt_price)
        );
        const amount_a = fix_coin_amount.toString();
        const amount_b = liquidityInput.tokenMaxB.toString();

        console.log(`   - Depositing approx. ${SUI_AMOUNT_TO_DEPOSIT} SUI and ${Number(amount_b) / (10 ** WAL_DECIMALS)} WAL`);
        console.log('2/4: Fetching coin metadata...');
        
        const metadataA = await client.getCoinMetadata({ coinType: SUI_COIN_TYPE });
        const metadataB = await client.getCoinMetadata({ coinType: WAL_COIN_TYPE });
        if (!metadataA?.id || !metadataB?.id) {
            throw new Error("Could not fetch coin metadata for SUI or WAL.");
        }
        
        console.log('3/4: Building transaction...');
        
        // --- CORRECCIÓN 2: Se quita `await` de esta llamada ---
        const tx = await sdk.Pool.createPoolTransactionPayload({
            coinTypeA: SUI_COIN_TYPE,
            coinTypeB: WAL_COIN_TYPE,
            tick_spacing: tick_spacing,
            initialize_sqrt_price: initialize_sqrt_price,
            uri: '',
            amount_a: amount_a,
            amount_b: amount_b,
            fix_amount_a: true,
            tick_lower: tick_lower,
            tick_upper: tick_upper,
            metadata_a: metadataA.id,
            metadata_b: metadataB.id,
            slippage:0
        });

        console.log('4/4: Signing and executing transaction...');
        
          const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: { showObjectChanges: true },
        });


        await client.waitForTransaction({ digest: result.digest });
        
        const createdPool = result.objectChanges?.find(
            (change: any) => change.type === 'created' && change.objectType.includes('::pool::Pool')
        );

        if (!createdPool || !('objectId' in createdPool)) {
            throw new Error("Transaction succeeded, but could not find the new Pool ID.");
        }

        console.log('\n✅ ¡Pool de Cetus Creado Exitosamente!');
        console.log('-------------------------------------');
        console.log('   Nuevo Pool ID para SUI/WAL:', createdPool.objectId);
        console.log('-------------------------------------');

    } catch (error: any) {
        console.error('--- ERROR DETALLADO ---', error);
    }
}

main();