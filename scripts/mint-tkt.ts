// scripts/mint-tkt.ts
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '../src/config/sui'; // Asegúrate de que la ruta sea correcta
import 'dotenv/config';

// --- CONFIGURACIÓN ---
const AMOUNT_TO_MINT = '1000000000000000'; // 1,000,000 TKT (con 9 decimales)

async function main() {
    console.log('🚀 Inicializando script para mintear TKT...');

    // 1. Cargar tu clave privada y configurar el cliente
    const privateKey = process.env.PROVIDER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PROVIDER_PRIVATE_KEY no está definido en tu archivo .env');
    }
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const userAddress = keypair.getPublicKey().toSuiAddress();
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    console.log(`🔑 Usando la dirección: ${userAddress}`);
    console.log(`💰 Cantidad a mintear: ${Number(AMOUNT_TO_MINT) / 1e9} TKT`);

    try {
        const tx = new Transaction();

        // --- CORRECCIÓN AQUÍ ---

        // 2. Llamamos a `coin::mint` solo con los 2 argumentos que espera.
        //    Esta llamada devuelve un nuevo objeto Coin.
        const newTktCoin = tx.moveCall({
            target: `0x2::coin::mint`,
            typeArguments: [`${suiConfig.tktPackageId}::tkt::TKT`],
            arguments: [
                tx.object(suiConfig.tktTreasuryCapId),
                tx.pure.u64(AMOUNT_TO_MINT),
                // Se elimina el argumento 'recipient'
            ],
        });

        // 3. Transferimos la moneda recién creada a nuestra dirección.
        tx.transferObjects([newTktCoin], tx.pure.address(userAddress));


        console.log('✍️  Firmando y ejecutando la transacción...');
        
        // 4. Firmar y ejecutar la transacción
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
        });
        
        await client.waitForTransaction({ digest: result.digest });

        console.log('\n✅ ¡TKT minteados exitosamente!');
        console.log('   Transaction Digest:', result.digest);
        console.log('   Ahora deberías tener TKT en tu billetera. ¡Verifícalo con `sui client balance`!');

    } catch (error) {
        console.error('--- ❌ ERROR DETALLADO ---', error);
    }
}

main();