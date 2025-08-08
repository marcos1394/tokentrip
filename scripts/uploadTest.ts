// scripts/uploadTestWithRelay.ts
import 'dotenv/config';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { WalrusClient, WalrusFile } from '@mysten/walrus';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { fromB64, fromHEX } from '@mysten/bcs';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURACIÓN ---
const WALRUS_NETWORK = 'testnet';
const IMAGE_PATH = path.join(__dirname, 'test-image.png');

async function main() {
    console.log('🚀 Iniciando script de prueba para subir a Walrus USANDO EL RELAY...');

    // 1. Cargar y decodificar la clave privada (lógica robusta que ya funciona)
    const privateKey = process.env.PROVIDER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('La variable de entorno PROVIDER_PRIVATE_KEY no está definida en scripts/.env');
    }

    console.log('🔐 Decodificando la clave privada...');
    let keypair: Ed25519Keypair;
    try {
        if (privateKey.startsWith('suiprivkey')) {
            const { schema, secretKey } = decodeSuiPrivateKey(privateKey);
            if (schema !== 'ED25519') throw new Error(`Esquema no soportado: ${schema}`);
            keypair = Ed25519Keypair.fromSecretKey(secretKey);
        } else {
            const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
            let keyBytes = fromHEX(cleanKey);
            if (keyBytes.length !== 32) throw new Error('Longitud de clave inválida');
            keypair = Ed25519Keypair.fromSecretKey(keyBytes);
        }
    } catch (err: any) {
        console.error("❌ Error al decodificar la clave privada:", err.message);
        throw new Error(`Formato de clave privada inválido.`);
    }
    
    const userAddress = keypair.getPublicKey().toSuiAddress();
    console.log(`✅ Cuenta cargada: ${userAddress}`);

    // --- CAMBIO CLAVE: INICIALIZACIÓN DEL CLIENTE CON UPLOAD RELAY ---
    const suiClient = new SuiClient({ url: getFullnodeUrl(WALRUS_NETWORK) });
    const walrusClient = new WalrusClient({
        suiClient,
        network: WALRUS_NETWORK,
        // Al ejecutar desde un script (Node.js), no hay errores de CORS.
        // Esto nos permite probar si el relay funciona correctamente.
        uploadRelay: {
            host: 'https://upload-relay.testnet.walrus.space',
            sendTip: { max: 1000 },
        },
    });
    console.log(`🌐 Cliente de Walrus inicializado para ${WALRUS_NETWORK} con Upload Relay.`);
    // --- FIN DEL CAMBIO ---

    // 4. Cargar la imagen desde el disco
    if (!fs.existsSync(IMAGE_PATH)) {
        throw new Error(`No se encontró la imagen en la ruta: ${IMAGE_PATH}`);
    }
    const fileBuffer = fs.readFileSync(IMAGE_PATH);
    const uint8Array = new Uint8Array(fileBuffer);
    console.log(`🖼️  Imagen cargada: ${IMAGE_PATH} (${uint8Array.length} bytes)`);

    // 5. Ejecutar el flujo de Walrus
    try {
        const flow = walrusClient.writeFilesFlow({
            files: [WalrusFile.from({ contents: uint8Array, identifier: 'test-from-relay-script.png' })],
        });

        await flow.encode();
        console.log('✅ Paso 1/4: Archivo codificado.');

        const registerTx = flow.register({
            epochs: 53,
            owner: userAddress,
            deletable: false,
        });

        console.log('⏳ Paso 2/4: Firmando y ejecutando transacción de registro...');
        const registerResult = await suiClient.signAndExecuteTransaction({
            signer: keypair,
            transaction: registerTx,
        });
        await suiClient.waitForTransaction({ digest: registerResult.digest });
        console.log('✅ Paso 2/4: Registro completado. Digest:', registerResult.digest);
        
        console.log('⏳ Paso 3/4: Subiendo datos al RELAY...');
        // El método `upload` ahora usará el relay configurado en el cliente.
        await flow.upload({ digest: registerResult.digest });
        console.log('✅ Paso 3/4: Datos subidos al relay.');

        const certifyTx = flow.certify();
        console.log('⏳ Paso 4/4: Firmando y ejecutando transacción de certificación...');
        const certifyResult = await suiClient.signAndExecuteTransaction({
            signer: keypair,
            transaction: certifyTx,
        });
        await suiClient.waitForTransaction({ digest: certifyResult.digest });
        console.log('✅ Paso 4/4: Certificación completada. Digest:', certifyResult.digest);

        const files = await flow.listFiles();
        const finalImageUrl = `https://gateway.walrus.space/blobs/${files[0].blobId}`;

        console.log('\n🎉 ¡ÉXITO! La subida a través del RELAY se completó.');
        console.log('🔗 URL Final de la Imagen:', finalImageUrl);

    } catch (error) {
        console.error('\n❌ ERROR DURANTE EL FLUJO DE WALRUS CON RELAY:');
        console.error(error);
    }
}

main().catch(console.error);