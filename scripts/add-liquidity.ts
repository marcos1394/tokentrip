// scripts/add-liquidity.ts
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64, fromHEX } from '@mysten/bcs';
import { normalizeStructTag } from '@mysten/sui/utils';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import BN from 'bn.js'; // Asegúrate de importar BN
import 'dotenv/config';

async function main() {
    // --- Configuración ---
    const SUI_COIN_TYPE = '0x2::sui::SUI';
    const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
    const SUI_DECIMALS = 9;
    const WAL_DECIMALS = 9;
    
    // Cargar la clave privada desde el .env
    const privateKey = process.env.PROVIDER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("Por favor, establece SUI_PRIVATE_KEY en tu archivo .env");
    }

    console.log('🔐 Intentando cargar clave privada...');

    // Decodificar la clave privada - manejar diferentes formatos
    let keypair: Ed25519Keypair;
    try {
        // Método 1: Intentar con decodeSuiPrivateKey (para formato suiprivkey)
        if (privateKey.startsWith('suiprivkey')) {
            console.log('   Usando formato suiprivkey...');
            const { schema, secretKey } = decodeSuiPrivateKey(privateKey);
            // Corrección 1: Comparar correctamente el esquema
            if (schema !== 'ED25519') { // O usa schema.toString() si es necesario
                throw new Error(`Esquema de clave no soportado: ${schema}`);
            }
            keypair = Ed25519Keypair.fromSecretKey(secretKey);
        } 
        // Método 2: Intentar como base64 o hex directo
        else {
            console.log('   Usando formato base64 o hex...');
            const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
            let secretKeyBytes: Uint8Array;
            
            try {
                // Intentar como base64
                secretKeyBytes = fromB64(cleanPrivateKey);
            } catch {
                // Intentar como hex
                secretKeyBytes = fromHEX(cleanPrivateKey);
            }
            
            // Para Ed25519, las claves secretas son 32 bytes
            if (secretKeyBytes.length >= 32) {
                keypair = Ed25519Keypair.fromSecretKey(secretKeyBytes.slice(0, 32));
            } else {
                throw new Error("Longitud de clave inválida");
            }
        }
    } catch (err) {
        // Corrección 2: Verificar tipo de err antes de usar .message
        let errorMessage = "Error desconocido";
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }
        console.error("❌ Error al decodificar la clave privada:", err);
        throw new Error(`Formato de clave privada inválido o no soportado. Error: ${errorMessage}`);
    }

    const userAddress = keypair.getPublicKey().toSuiAddress();
    console.log('✅ Cuenta cargada:', userAddress);

    // Verificar que sea la cuenta esperada
    const expectedAddress = '0x54b9ca2addbb344692346c8a48ee80e47c5bffa4a73abac16de21d9e95d49761';
    if (userAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
        console.warn('⚠️  ¡La cuenta cargada no coincide con la esperada!');
        console.warn(`   Esperada: ${expectedAddress}`);
        console.warn(`   Cargada:  ${userAddress}`);
        // Puedes decidir si continuar o detenerte aquí
        // throw new Error("Cuenta incorrecta cargada desde la clave privada");
    }

    // Inicializar cliente y SDK
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sdk = initCetusSDK({ 
        network: 'testnet',
        fullNodeUrl: getFullnodeUrl('testnet'),
    });
    sdk.senderAddress = userAddress;

    try {
        // Verificar balances
        console.log('\n💰 Verificando balances...');
        const suiBalance = await client.getBalance({
            owner: userAddress,
            coinType: SUI_COIN_TYPE,
        });
        const walBalance = await client.getBalance({
            owner: userAddress,
            coinType: WAL_COIN_TYPE,
        });
        
        const suiAmount = Number(suiBalance.totalBalance) / Math.pow(10, SUI_DECIMALS);
        const walAmount = Number(walBalance.totalBalance) / Math.pow(10, WAL_DECIMALS);
        
        console.log(`   SUI: ${suiAmount.toFixed(2)} SUI`);
        console.log(`   WAL: ${walAmount.toFixed(2)} WAL`);

        // Verificar que tengamos suficientes fondos
        if (suiAmount < 0.3) {
            throw new Error(`Fondos insuficientes de SUI. Necesitas al menos 1.0 SUI, tienes ${suiAmount.toFixed(2)} SUI`);
        }
        if (walAmount < 1.4) {
            throw new Error(`Fondos insuficientes de WAL. Necesitas al menos 1.5 WAL, tienes ${walAmount.toFixed(2)} WAL`);
        }

        // Definir cuánta liquidez quieres añadir (ajustado a tus fondos)
        const amountSUI = Math.min(1.0, suiAmount * 0.8); // Usar 80% del balance o 1.0, lo que sea menor
        const amountWAL = Math.min(1.5, walAmount * 0.8); // Usar 80% del balance o 1.5, lo que sea menor
        
        console.log(`\n💧 Preparando para añadir liquidez:`);
        console.log(`   Añadir: ${amountSUI.toFixed(2)} SUI`);
        console.log(`   Añadir: ${amountWAL.toFixed(2)} WAL`);

        // Convertir a unidades base
        const amountSUIBase = Math.floor(amountSUI * Math.pow(10, SUI_DECIMALS));
        const amountWALBase = Math.floor(amountWAL * Math.pow(10, WAL_DECIMALS));
        
        console.log(`\n🔧 Cantidades en unidades base:`);
        console.log(`   SUI: ${amountSUIBase}`);
        console.log(`   WAL: ${amountWALBase}`);

        // Encontrar el pool
        console.log('\n🔍 Buscando pool SUI/WAL...');
        const allPools = await sdk.Pool.getPoolsWithPage([]);
        if (!allPools) {
            throw new Error("No se pudieron obtener pools");
        }
        
        const normalizedSui = normalizeStructTag(SUI_COIN_TYPE);
        const normalizedWal = normalizeStructTag(WAL_COIN_TYPE);

        const bestPool = allPools.find(p => 
            (normalizeStructTag(p.coinTypeA) === normalizedSui && normalizeStructTag(p.coinTypeB) === normalizedWal) ||
            (normalizeStructTag(p.coinTypeA) === normalizedWal && normalizeStructTag(p.coinTypeB) === normalizedSui)
        );

        if (!bestPool) {
            throw new Error("No se encontró pool para SUI/WAL");
        }
        
        console.log(`✅ Pool encontrado: ${bestPool.poolAddress}`);
        console.log(`📊 Pool details:`, {
            coinAmountA: bestPool.coinAmountA,
            coinAmountB: bestPool.coinAmountB,
            current_tick_index: bestPool.current_tick_index,
            current_sqrt_price: bestPool.current_sqrt_price,
            tickSpacing: bestPool.tickSpacing
        });

        // Obtener información del pool
        const pool = await sdk.Pool.getPool(bestPool.poolAddress);
        console.log(`📊 Current tick index: ${pool.current_tick_index}`);
        console.log(`📊 Tick spacing: ${pool.tickSpacing}`);
        console.log(`📊 Current sqrt price: ${pool.current_sqrt_price}`);

        // Calcular ticks para el rango de liquidez
        // Usar ticks inicializables cercanos al precio actual (como en la documentación)
        const tickLower = Math.floor(Number(pool.current_tick_index) / Number(pool.tickSpacing)) * Number(pool.tickSpacing) - Number(pool.tickSpacing);
        const tickUpper = Math.ceil(Number(pool.current_tick_index) / Number(pool.tickSpacing)) * Number(pool.tickSpacing) + Number(pool.tickSpacing);
        
        console.log(`\n📐 Rango de ticks calculado:`);
        console.log(`   Tick lower: ${tickLower}`);
        console.log(`   Tick upper: ${tickUpper}`);
        console.log(`   Current tick: ${pool.current_tick_index}`);

        // Crear la transacción para añadir liquidez (método 2: con cantidades fijas)
        console.log('\n🔨 Creando transacción para añadir liquidez con cantidades fijas...');
        
        const addLiquidityPayloadParams = {
            coinTypeA: bestPool.coinTypeA,          // WAL
            coinTypeB: bestPool.coinTypeB,          // SUI
            pool_id: bestPool.poolAddress,
            tick_lower: tickLower.toString(),
            tick_upper: tickUpper.toString(),
            fix_amount_a: false,                    // false = fijar cantidad de coinB (SUI)
            amount_a: amountWALBase,                // WAL amount
            amount_b: amountSUIBase,                // SUI amount
            slippage: 0.01,                         // 1% de slippage
            is_open: true,                          // Abrir nueva posición
            pos_id: '',                             // Vacío para nueva posición
            rewarder_coin_types: [] as string[],    // Sin rewarders
            collect_fee: false,                     // No cobrar fees
        };

        console.log('📋 Parámetros para add liquidity:', addLiquidityPayloadParams);

        // Corrección 3: Convertir current_sqrt_price a BN
        const currentSqrtPriceBN = new BN(pool.current_sqrt_price);

        // Crear el payload usando el método recomendado de la documentación
        const addLiquidityPayload = await sdk.Position.createAddLiquidityFixTokenPayload(
            addLiquidityPayloadParams,
            {
                slippage: 0.01,
                curSqrtPrice: currentSqrtPriceBN, // Usar BN
            }
        );

        console.log('✅ Transacción creada');

        // Ejecutar la transacción
        console.log('\n🚀 Ejecutando transacción...');
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: addLiquidityPayload,
        });

        console.log('\n✅ ¡Liquidez añadida exitosamente!');
        console.log(`   Digest: ${result.digest}`);
        
        // Esperar a que se confirme
        console.log('⏳ Esperando confirmación...');
        const txResult = await client.waitForTransaction({
            digest: result.digest,
            options: { showEffects: true },
        });
        
        if (txResult.effects?.status.status === 'success') {
            console.log('✅ Transacción confirmada exitosamente');
            console.log('🎉 ¡Has añadido liquidez al pool SUI/WAL!');
            console.log('   Ahora el pool tendrá más reservas y podrás hacer swaps más efectivos.');
        } else {
            console.log('❌ La transacción falló');
            console.log(txResult.effects);
        }

    } catch (error: any) {
        // Corrección 2 (también aquí): Verificar tipo de error
        let errorMessage = "Error desconocido";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        console.error('--- ERROR DETALLADO ---', error);
        console.error('Mensaje de error:', errorMessage);
        
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

main();