// scripts/create-new-tkt-pool.ts

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { initCetusSDK, TickMath } from '@cetusprotocol/cetus-sui-clmm-sdk';
import BN from 'bn.js';
import 'dotenv/config';
import Decimal from 'decimal.js';
import { suiConfig } from '../src/config/sui';

// --- CONFIGURACIÓN ---
const SUI_COIN_TYPE = '0x2::sui::SUI';
const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
const SUI_DECIMALS = 9;
const TKT_DECIMALS = 9;

// --- PARÁMETROS DE LIQUIDEZ ---
const SUI_TO_DEPOSIT = 1.0;
const TKT_TO_DEPOSIT = 50000; // Precio: 1 SUI = 50,000 TKT

async function main() {
    console.log(`🚀 Creando NUEVO pool con ${SUI_TO_DEPOSIT} SUI y ${TKT_TO_DEPOSIT} TKT...`);
    
    const privateKey = process.env.PROVIDER_PRIVATE_KEY;
    if (!privateKey) throw new Error("PROVIDER_PRIVATE_KEY no está definido en tu .env");
    
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = initCetusSDK({ network: 'testnet' });
    sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
    
    console.log(`🔑 Usando la dirección: ${sdk.senderAddress}`);

    try {
        console.log('1/4: Calculando parámetros del pool...');
        
        const isTktCoinA = TKT_COIN_TYPE > SUI_COIN_TYPE;
        const coinTypeA = isTktCoinA ? TKT_COIN_TYPE : SUI_COIN_TYPE;
        const coinTypeB = isTktCoinA ? SUI_COIN_TYPE : TKT_COIN_TYPE;
        const [decimalsA, decimalsB] = isTktCoinA ? [TKT_DECIMALS, SUI_DECIMALS] : [SUI_DECIMALS, TKT_DECIMALS];
        
        console.log(`   - Orden de monedas determinado: CoinA=${coinTypeA.split('::')[2]}, CoinB=${coinTypeB.split('::')[2]}`);

        const price = isTktCoinA 
            ? new Decimal(1).div(TKT_TO_DEPOSIT) // Precio de SUI por TKT
            : new Decimal(TKT_TO_DEPOSIT);      // Precio de TKT por SUI
        
        const tick_spacing = 60;
        const initialize_sqrt_price = TickMath.priceToSqrtPriceX64(price, decimalsA, decimalsB).toString();
        
        const current_tick_index = Number(TickMath.sqrtPriceX64ToTickIndex(new BN(initialize_sqrt_price)));
        const tick_lower = TickMath.getPrevInitializableTickIndex(current_tick_index, tick_spacing);
        const tick_upper = TickMath.getNextInitializableTickIndex(current_tick_index, tick_spacing);

        const amount_a_bn = new BN((isTktCoinA ? TKT_TO_DEPOSIT : SUI_TO_DEPOSIT) * (10 ** decimalsA));
        const amount_b_bn = new BN((isTktCoinA ? SUI_TO_DEPOSIT : TKT_TO_DEPOSIT) * (10 ** decimalsB));
        
        console.log('2/4: Obteniendo metadatos de las monedas...');
        const metadataA = await client.getCoinMetadata({ coinType: coinTypeA });
        const metadataB = await client.getCoinMetadata({ coinType: coinTypeB });
        if (!metadataA?.id || !metadataB?.id) {
            throw new Error("No se pudieron obtener los metadatos de las monedas.");
        }

        console.log('3/4: Construyendo la transacción...');
        
        // --- PAYLOAD COMPLETO Y CORREGIDO ---
        const txPayload = await sdk.Pool.createPoolTransactionPayload({
            coinTypeA: coinTypeA,
            coinTypeB: coinTypeB,
            tick_spacing: tick_spacing,
            initialize_sqrt_price: initialize_sqrt_price,
            uri: 'https://tokentrip.com/pool/sui-tkt-v2',
            amount_a: amount_a_bn.toString(),
            amount_b: amount_b_bn.toString(),
            tick_lower: tick_lower,
            tick_upper: tick_upper,
            fix_amount_a: true, // Siempre fijamos la moneda A en esta lógica
            metadata_a: metadataA.id,
            metadata_b: metadataB.id,
            slippage: 0.01,
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

        console.log('\n✅ ¡NUEVO Pool de Cetus Creado Exitosamente!');
        console.log('-------------------------------------');
        console.log(`   Nuevo Pool ID para SUI/TKT:`, createdPool.objectId);
        console.log('-------------------------------------');
        console.log('🔴 ¡Recuerda actualizar este ID en tu archivo `sui.ts`!');

    } catch (error: any) {
        console.error('--- ❌ ERROR DETALLADO ---', error);
    }
}

main();