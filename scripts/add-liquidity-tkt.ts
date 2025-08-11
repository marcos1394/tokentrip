// scripts/add-liquidity-tkt.ts

import { initCetusSDK, TickMath } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import BN from 'bn.js';
import 'dotenv/config';
import { suiConfig } from '../src/config/sui';

// --- CONFIGURACIÓN ---
const SUI_COIN_TYPE = '0x2::sui::SUI';
const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
const POOL_ID = suiConfig.suiTktPoolId;
const SUI_TO_DEPOSIT = 1.0;

async function main() {
    console.log(`🚀 Añadiendo ${SUI_TO_DEPOSIT} SUI de liquidez al pool...`);
    
    const privateKey = process.env.PROVIDER_PRIVATE_KEY;
    if (!privateKey) throw new Error("PROVIDER_PRIVATE_KEY no está definido en tu archivo .env");
    
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const userAddress = keypair.getPublicKey().toSuiAddress();
    
    console.log(`🔐 Usando la dirección: ${userAddress}`);

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = initCetusSDK({ network: 'testnet' });
    sdk.senderAddress = userAddress;

    try {
        console.log('\n🔍 Obteniendo información del pool...');
        const pool = await sdk.Pool.getPool(POOL_ID);
        
        // --- CÁLCULO DE TICKS CORREGIDO Y ROBUSTO ---

        // 1. Usamos el precio actual real del pool
        const currentSqrtPrice = new BN(pool.current_sqrt_price);
        const current_tick_index = TickMath.sqrtPriceX64ToTickIndex(currentSqrtPrice);
        const tick_spacing = Number(pool.tickSpacing);
        
        // 2. Usamos las funciones del SDK para encontrar los ticks válidos más cercanos
        const nearestLowerTick = TickMath.getPrevInitializableTickIndex(Number(current_tick_index), tick_spacing);
        const nearestUpperTick = TickMath.getNextInitializableTickIndex(Number(current_tick_index), tick_spacing);
        
        // 3. Creamos un rango amplio a partir de esos ticks válidos
        const tickMultiplier = 30; // Un rango aún más amplio para asegurar
        const tick_lower = nearestLowerTick - (tick_spacing * tickMultiplier);
        const tick_upper = nearestUpperTick + (tick_spacing * tickMultiplier);
        
        console.log(`   Rango de Ticks calculado: [${tick_lower}, ${tick_upper}]`);
        
        const amountSuiBase = new BN(SUI_TO_DEPOSIT * (10 ** 9));

        const addLiquidityParams = {
            pool_id: pool.poolAddress,
            coinTypeA: pool.coinTypeA,
            coinTypeB: pool.coinTypeB,
            tick_lower: tick_lower,
            tick_upper: tick_upper,
            amount_a: (pool.coinTypeA === SUI_COIN_TYPE ? amountSuiBase : new BN(0)).toString(),
            amount_b: (pool.coinTypeB === SUI_COIN_TYPE ? amountSuiBase : new BN(0)).toString(),
            fix_amount_a: pool.coinTypeA === SUI_COIN_TYPE,
            is_open: true,
            slippage: 0.05,
            collect_fee: false,
            rewarder_coin_types: [] as string[],
            pos_id: '',
        };

        console.log('\n🔨 Creando transacción...');
        const addLiquidityPayload = await sdk.Position.createAddLiquidityFixTokenPayload(
            addLiquidityParams,
            {
                curSqrtPrice: currentSqrtPrice,
                slippage: 0
            }
        );

        console.log('✅ Transacción creada');
        console.log('\n🚀 Ejecutando transacción...');

        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: addLiquidityPayload,
        });

        await client.waitForTransaction({ digest: result.digest });
        
        console.log('\n🎉 ¡Liquidez añadida exitosamente al pool SUI/TKT!');
        console.log(`   Digest: ${result.digest}`);

    } catch (error: any) {
        console.error('--- ❌ ERROR DETALLADO ---', error);
    }
}

main();