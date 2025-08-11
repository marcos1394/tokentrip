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
import Decimal from 'decimal.js';
import { suiConfig } from '../src/config/sui';

// --- CONFIGURACIÓN PARA SUI/TKT ---
const SUI_COIN_TYPE = '0x2::sui::SUI';
const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
const SUI_DECIMALS = 9;
const TKT_DECIMALS = 9;

// --- PARÁMETROS DE LIQUIDEZ ---
const SUI_AMOUNT_TO_DEPOSIT = 1.0; 
const INITIAL_PRICE_TKT_PER_SUI = 1000; 

async function main() {
    console.log('🚀 Inicializando script para crear pool SUI/TKT...');
    
    const privateKey = process.env.PROVIDER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PROVIDER_PRIVATE_KEY is not defined in your .env file');
    }
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    const sdk = initCetusSDK({
        network: 'testnet',
    });
    sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
    
    console.log(`🔑 Usando la dirección: ${sdk.senderAddress}`);

    try {
        console.log('1/4: Calculando parámetros del pool...');
        
        const tick_spacing = 60;
        const initialize_sqrt_price = TickMath.priceToSqrtPriceX64(
            new Decimal(INITIAL_PRICE_TKT_PER_SUI), 
            SUI_DECIMALS, 
            TKT_DECIMALS
        ).toString();
        
        const current_tick_index = TickMath.sqrtPriceX64ToTickIndex(new BN(initialize_sqrt_price));
        // Estas son las variables correctas para los ticks
        const tick_lower = TickMath.getPrevInitializableTickIndex(current_tick_index, tick_spacing);
        const tick_upper = TickMath.getNextInitializableTickIndex(current_tick_index, tick_spacing);

        const fix_coin_amount = new BN(SUI_AMOUNT_TO_DEPOSIT * (10 ** SUI_DECIMALS));
        const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
            tick_lower, tick_upper, fix_coin_amount, true, true, 0.01, new BN(initialize_sqrt_price)
        );
        const amount_a = fix_coin_amount.toString();
        const amount_b = liquidityInput.tokenMaxB.toString();

        console.log(`   - Depositando aprox. ${SUI_AMOUNT_TO_DEPOSIT} SUI y ${Number(amount_b) / (10 ** TKT_DECIMALS)} TKT`);
        console.log('2/4: Obteniendo metadatos de las monedas...');
        
        // Estas son las variables correctas para los metadatos
        const metadataA = await client.getCoinMetadata({ coinType: SUI_COIN_TYPE });
        const metadataB = await client.getCoinMetadata({ coinType: TKT_COIN_TYPE });
        if (!metadataA?.id || !metadataB?.id) {
            throw new Error("No se pudieron obtener los metadatos para SUI o TKT.");
        }
        
        console.log('3/4: Construyendo la transacción...');
        
        // --- CORRECCIÓN FINAL Y COMPLETA AQUÍ ---
        const txPayload = await sdk.Pool.createPoolTransactionPayload({
            coinTypeA: SUI_COIN_TYPE,
            coinTypeB: TKT_COIN_TYPE,
            tick_spacing: tick_spacing,
            initialize_sqrt_price: initialize_sqrt_price,
            uri: 'https://tokentrip.com/pool/sui-tkt',
            amount_a: amount_a,
            amount_b: amount_b,
            // Usamos las variables correctas en lugar de valores fijos
            fix_amount_a: true, 
            tick_lower: tick_lower,
            tick_upper: tick_upper,
            metadata_a: metadataA.id, // Pasamos el ID del objeto de metadatos
            metadata_b: metadataB.id, // Pasamos el ID del objeto de metadatos
            slippage: 0.01, // Usamos un slippage pequeño pero seguro
        });

        console.log('4/4: Firmando y ejecutando la transacción...');
        
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: txPayload,
            options: { showObjectChanges: true },
        });

        await client.waitForTransaction({ digest: result.digest });
        
        const createdPool = result.objectChanges?.find(
            (change: any) => change.type === 'created' && change.objectType.includes('::pool::Pool')
        );

        if (!createdPool || !('objectId' in createdPool)) {
            throw new Error("La transacción tuvo éxito, pero no se pudo encontrar el ID del nuevo Pool.");
        }

        console.log('\n✅ ¡Pool de Cetus Creado Exitosamente!');
        console.log('-------------------------------------');
        console.log('   Nuevo Pool ID para SUI/TKT:', createdPool.objectId);
        console.log('-------------------------------------');

    } catch (error: any) {
        console.error('--- ❌ ERROR DETALLADO ---', error);
    }
}

main();