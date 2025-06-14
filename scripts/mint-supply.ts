// tokentrip_token/scripts/mint-supply.ts

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';
import path from 'path';

// Apuntamos a un .env que estará en la raíz de este proyecto de token
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
  console.log('--- Iniciando script para acuñar el suministro total de TKT ---');

  const packageId = process.env.TKT_PACKAGE_ID;
  const treasuryCapId = process.env.TKT_TREASURY_CAP_ID;
  const adminMnemonic = process.env.SUI_ADMIN_MNEMONIC;

  if (!packageId || !treasuryCapId || !adminMnemonic) {
    throw new Error('Error: TKT_PACKAGE_ID, TKT_TREASURY_CAP_ID o SUI_ADMIN_MNEMONIC no están definidos en .env.local');
  }

  const client = new SuiClient({ url: getFullnodeUrl('devnet') });

  // CORRECCIÓN: Se usa `deriveKeypair` que es compatible con tu versión del SDK.
  const keypair = Ed25519Keypair.deriveKeypair(adminMnemonic);
  const adminAddress = keypair.getPublicKey().toSuiAddress();
  
  console.log(`Usando TKT Package ID: ${packageId}`);
  console.log(`Usando TKT TreasuryCap ID: ${treasuryCapId}`);
  console.log(`Acuñando para la dirección: ${adminAddress}`);

  // Definimos el suministro total basado en nuestro tokenomics
  const TOTAL_SUPPLY = 1_000_000_000;
  const DECIMALS = 9;
  const amountToMint = BigInt(TOTAL_SUPPLY) * BigInt(10 ** DECIMALS);

  const tx = new Transaction();

  // 1. Llamamos a la función `mint` del módulo `coin` de Sui
  const [mintedCoin] = tx.moveCall({
    target: `0x2::coin::mint`,
    // El tipo genérico <T> es nuestro token TKT
    typeArguments: [`${packageId}::tkt::TKT`], 
    arguments: [
      tx.object(treasuryCapId),      // La capacidad de acuñar
      tx.pure.u64(amountToMint),     // La cantidad a acuñar
    ],
  });

  // 2. Transferimos la moneda gigante recién creada a nuestra billetera de admin
  tx.transferObjects([mintedCoin], tx.pure.address(adminAddress));

  console.log('Enviando transacción para acuñar suministro total...');

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showObjectChanges: true }
  });

  console.log('¡Transacción de acuñación exitosa!');
  console.log('Digest:', result.digest);

  const adminCoin = result.objectChanges?.find(
    (change: any) => 
        change.type === 'created' && 
        change.owner.AddressOwner === adminAddress &&
        change.objectType.endsWith('::coin::Coin<tkt::TKT>')
  );

  if (adminCoin) {
     console.log('\n====================================================');
     console.log('✅ SUMINISTRO TOTAL DE TKT ACUÑADO Y ENVIADO AL ADMIN');
     console.log('====================================================');
  }
}

main().catch(console.error);