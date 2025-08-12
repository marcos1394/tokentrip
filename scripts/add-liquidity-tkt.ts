// scripts/add-liquidity-tkt.ts

import { initCetusSDK, TickMath } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import BN from 'bn.js';
import 'dotenv/config';
import { suiConfig } from '../src/config/sui';

// --- CONFIGURACIÓN DE LIQUIDEZ ---
const SUI_TO_DEPOSIT = 1.0;
const TKT_TO_DEPOSIT = 500000;

// --- CONFIGURACIÓN DE TOKENS (No tocar) ---
const SUI_COIN_TYPE = '0x2::sui::SUI';
const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
const POOL_ID = suiConfig.suiTktPoolId;
const SUI_DECIMALS = 9;
const TKT_DECIMALS = 9;

async function main() {
    console.log(`🚀 Añadiendo ${SUI_TO_DEPOSIT} SUI y ${TKT_TO_DEPOSIT} TKT de liquidez al pool...`);
    
    const privateKey = process.env.PROVIDER_PRIVATE_KEY;
    if (!privateKey) throw new Error("PROVIDER_PRIVATE_KEY no está definido en tu .env");
    
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const userAddress = keypair.getPublicKey().toSuiAddress();
    
    console.log(`🔐 Usando la dirección: ${userAddress}`);

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = initCetusSDK({ network: 'testnet' });
    sdk.senderAddress = userAddress;

    try {
        console.log('\n🔍 Obteniendo información del pool...');
        const pool = await sdk.Pool.getPool(POOL_ID);
        
        const suiAmountBase = new BN(SUI_TO_DEPOSIT * (10 ** SUI_DECIMALS));
        const tktAmountBase = new BN(TKT_TO_DEPOSIT * (10 ** TKT_DECIMALS));

        // --- CORRECCIÓN FINAL: CÁLCULO DE TICKS ALREDEDOR DEL PRECIO ACTUAL ---
        const currentSqrtPrice = new BN(pool.current_sqrt_price);
        const current_tick_index = Number(TickMath.sqrtPriceX64ToTickIndex(currentSqrtPrice));
        const tick_spacing = Number(pool.tickSpacing);
        
        // Creamos un rango muy amplio ALREDEDOR DEL PRECIO ACTUAL para asegurar que sea válido
        const tickMultiplier = 1000; // Un número grande para crear un rango amplio
        const tick_lower = Math.floor(current_tick_index / tick_spacing) * tick_spacing - (tick_spacing * tickMultiplier);
        const tick_upper = Math.ceil(current_tick_index / tick_spacing) * tick_spacing + (tick_spacing * tickMultiplier);

        console.log(`   Usando rango de ticks válido y amplio: [${tick_lower}, ${tick_upper}]`);
        
        const addLiquidityParams = {
            pool_id: pool.poolAddress,
            coinTypeA: pool.coinTypeA,
            coinTypeB: pool.coinTypeB,
            tick_lower: tick_lower,
            tick_upper: tick_upper,
            amount_a: (pool.coinTypeA === SUI_COIN_TYPE ? suiAmountBase : tktAmountBase).toString(),
            amount_b: (pool.coinTypeB === SUI_COIN_TYPE ? suiAmountBase : tktAmountBase).toString(),
            fix_amount_a: pool.coinTypeA === SUI_COIN_TYPE,
            is_open: true,
            slippage: 0.1, // 10% de slippage
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
        
        console.log('\n🎉 ¡Liquidez añadida exitosamente!');
        console.log(`   Digest: ${result.digest}`);

    } catch (error: any) {
        console.error('--- ❌ ERROR DETALLADO ---', error);
    }
}

main();