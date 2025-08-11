// scripts/create-pool-tkt.ts

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

// --- CONFIGURACIÓN INICIAL ---
let SUI_COIN_TYPE = '0x2::sui::SUI';
let TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;
const SUI_DECIMALS = 9;
const TKT_DECIMALS = 9;

// --- PARÁMETROS DE LIQUIDEZ ---
const SUI_AMOUNT_TO_DEPOSIT = 1.0;
// Precio inicial: cuántos TKT obtienes por 1 SUI
const INITIAL_PRICE_TKT_PER_SUI = 0.5;

async function main() {
  console.log('🚀 Inicializando script para crear pool SUI/TKT...');
  
  const privateKey = process.env.PROVIDER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PROVIDER_PRIVATE_KEY is not defined in your .env file');
  }
  const keypair = Ed25519Keypair.fromSecretKey(privateKey);
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  
  const sdk = initCetusSDK({ network: 'testnet' });
  sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
  
  console.log(`🔑 Usando la dirección: ${sdk.senderAddress}`);

  try {
    console.log('1/4: Calculando parámetros del pool...');

    // --- CORRECCIÓN CLAVE: ORDENAR LAS MONEDAS ---
    // El SDK requiere que coinTypeA sea lexicográficamente menor que coinTypeB.
    const [coinTypeA, coinTypeB] = [SUI_COIN_TYPE, TKT_COIN_TYPE].sort();
    const [decimalsA, decimalsB] = coinTypeA === SUI_COIN_TYPE ? [SUI_DECIMALS, TKT_DECIMALS] : [TKT_DECIMALS, SUI_DECIMALS];

    // Calculamos el precio en términos de B/A
    const price = coinTypeA === SUI_COIN_TYPE 
      ? new Decimal(INITIAL_PRICE_TKT_PER_SUI) // Precio de TKT por SUI
      : new Decimal(1).div(INITIAL_PRICE_TKT_PER_SUI); // Precio de SUI por TKT

    const tick_spacing = 60;
    const initialize_sqrt_price = TickMath.priceToSqrtPriceX64(price, decimalsA, decimalsB).toString();
    
    const current_tick_index = TickMath.sqrtPriceX64ToTickIndex(new BN(initialize_sqrt_price));
    const tick_lower = TickMath.getPrevInitializableTickIndex(current_tick_index, tick_spacing);
    const tick_upper = TickMath.getNextInitializableTickIndex(current_tick_index, tick_spacing);

    // Determinamos qué moneda estamos fijando
    const isFixCoinA = coinTypeA === SUI_COIN_TYPE;
    const fix_coin_amount = new BN(SUI_AMOUNT_TO_DEPOSIT * (10 ** SUI_DECIMALS));

    // Estimamos la liquidez y el monto de la otra moneda
    const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
      tick_lower, tick_upper, fix_coin_amount, isFixCoinA, true, 0.01, new BN(initialize_sqrt_price)
    );
    const amount_a = isFixCoinA ? fix_coin_amount.toString() : liquidityInput.tokenMaxB.toString();
    const amount_b = isFixCoinA ? liquidityInput.tokenMaxB.toString() : fix_coin_amount.toString();

    console.log(`   - Depositando aprox. ${Number(amount_a) / (10 ** decimalsA)} de ${coinTypeA.split('::')[2]}`);
    console.log(`   - Y aprox. ${Number(amount_b) / (10 ** decimalsB)} de ${coinTypeB.split('::')[2]}`);
    console.log('2/4: Obteniendo metadatos de las monedas...');
    
    const metadataA = await client.getCoinMetadata({ coinType: coinTypeA });
    const metadataB = await client.getCoinMetadata({ coinType: coinTypeB });
    if (!metadataA?.id || !metadataB?.id) {
      throw new Error("No se pudieron obtener los metadatos de las monedas.");
    }
    
    console.log('3/4: Construyendo la transacción...');
    
    const txPayload = await sdk.Pool.createPoolTransactionPayload({
      coinTypeA: coinTypeA,
      coinTypeB: coinTypeB,
      tick_spacing: tick_spacing,
      initialize_sqrt_price: initialize_sqrt_price,
      uri: 'https://tokentrip.com/pool/sui-tkt',
      amount_a: amount_a,
      amount_b: amount_b,
      fix_amount_a: isFixCoinA,
      tick_lower: tick_lower,
      tick_upper: tick_upper,
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

    console.log('\n✅ ¡Pool de Cetus Creado Exitosamente!');
    console.log('-------------------------------------');
    console.log(`   Nuevo Pool ID para SUI/TKT:`, createdPool.objectId);
    console.log('-------------------------------------');

  } catch (error: any) {
    console.error('--- ❌ ERROR DETALLADO ---', error);
  }
}

main();