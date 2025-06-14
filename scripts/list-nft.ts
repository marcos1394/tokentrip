// scripts/list-nft.ts

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('--- Iniciando script para listar NFT ---');

  const nftIdToList = process.argv[2];
  const priceInMist = process.argv[3];

  if (!nftIdToList || !priceInMist) {
    console.error('Uso: npx ts-node scripts/list-nft.ts <ID_DEL_NFT> <PRECIO_EN_MIST>');
    process.exit(1);
  }

  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
  const adminCapId = process.env.ADMIN_CAP_ID;
  const adminMnemonic = process.env.SUI_ADMIN_MNEMONIC;

  if (!packageId || !adminCapId || !adminMnemonic) {
    throw new Error('Error: Variables de entorno no definidas.');
  }
  
  const client = new SuiClient({ url: getFullnodeUrl('devnet') });

  // CORRECCIÓN: Se usa `deriveKeypair` en lugar de `fromMnemonic`.
  const keypair = Ed25519Keypair.deriveKeypair(adminMnemonic);

  console.log(`Listando NFT con ID: ${nftIdToList}`);
  console.log(`Precio: ${priceInMist} MIST`);

  const tx = new Transaction();

  // CORRECCIÓN: Se usa `tx.pure.u64` y se convierte el precio a BigInt.
  tx.moveCall({
    target: `${packageId}::experience_nft::list_for_sale`,
    arguments: [
      tx.object(adminCapId),
      tx.object(nftIdToList),
      tx.pure.u64(BigInt(priceInMist)),
    ],
  });

  console.log('Enviando transacción para listar...');

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showObjectChanges: true }
  });

  console.log('¡Transacción de listado exitosa!', result.digest);

  const createdListing = result.objectChanges?.find(
    (change) => change.type === 'created' && change.objectType.endsWith('::experience_nft::Listing')
  );

  if (createdListing && 'objectId' in createdListing) {
    console.log('\n====================================================');
    console.log('✅ NFT LISTADO PARA LA VENTA CON ÉXITO');
    console.log('ID del nuevo Listing:', createdListing.objectId);
    console.log('====================================================');
  }
}

main().catch(console.error);