// scripts/mint-experience.ts

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('--- Iniciando script para acuñar NFT ---');

  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
  const adminCapId = process.env.ADMIN_CAP_ID;
  const adminMnemonic = process.env.SUI_ADMIN_MNEMONIC;

  if (!packageId || !adminCapId || !adminMnemonic) {
    throw new Error('Error: Variables de entorno no definidas.');
  }

  const client = new SuiClient({ url: getFullnodeUrl('devnet') });
  
  // CORRECCIÓN: Se usa `deriveKeypair` en lugar de `fromMnemonic`.
  const keypair = Ed25519Keypair.deriveKeypair(adminMnemonic);
  const adminAddress = keypair.getPublicKey().toSuiAddress();
  
  console.log(`Usando Package ID: ${packageId}`);
  console.log(`Usando Admin Cap ID: ${adminCapId}`);
  console.log(`Dirección del Admin: ${adminAddress}`);
  
  const nftDetails = {
    name: 'Pase Fan FIFA 2026 - Monterrey',
    description: 'Acceso exclusivo a la Fan Zone de TokenTrip y eventos especiales en la sede de Monterrey.',
    imageUrl: 'https://images.unsplash.com/photo-1543351341-79577a2e9162',
    eventName: 'Copa Mundial FIFA 2026',
    eventCity: 'Monterrey',
    validity: 'Fase de Grupos (11-27 Junio, 2026)',
    expType: 'Pase de Acceso Fan',
    tier: 'Oro',
    serial: 1,
    collection: 'Pases FIFA 2026',
    royaltyRecipient: adminAddress,
    royaltyBps: 500, // 5.00%
  };

  const tx = new Transaction();

  const attributesVec = tx.makeMoveVec({
    elements: [],
    type: `${packageId}::experience_nft::Attribute`,
  });
  
  // CORRECCIÓN: Se usa `tx.pure` de forma explícita para cada tipo de dato.
  const [nft] = tx.moveCall({
    target: `${packageId}::experience_nft::mint_experience`,
    arguments: [
      tx.object(adminCapId),
      tx.pure.string(nftDetails.name),
      tx.pure.string(nftDetails.description),
      tx.pure.string(nftDetails.imageUrl),
      tx.pure.string(nftDetails.eventName),
      tx.pure.string(nftDetails.eventCity),
      tx.pure.string(nftDetails.validity),
      tx.pure.string(nftDetails.expType),
      tx.pure.string(nftDetails.tier),
      tx.pure.u64(nftDetails.serial),
      tx.pure.string(nftDetails.collection),
      tx.pure.address(nftDetails.royaltyRecipient),
      tx.pure.u16(nftDetails.royaltyBps),
      attributesVec,
    ],
  });

  tx.transferObjects([nft], tx.pure.address(adminAddress));

  console.log('Enviando transacción para acuñar...');

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showObjectChanges: true }
  });

  console.log('¡Transacción de acuñación exitosa! Digest:', result.digest);

  const createdNft = result.objectChanges?.find(
    (change) => change.type === 'created' && change.objectType.endsWith('::experience_nft::ExperienceNFT')
  );

  if (createdNft && 'objectId' in createdNft) {
    console.log('\n====================================================');
    console.log('✅ NFT ACUÑADO CON ÉXITO');
    console.log('ID del nuevo NFT:', createdNft.objectId);
    console.log('====================================================');
  }
}

main().catch(console.error);