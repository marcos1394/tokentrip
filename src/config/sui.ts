// src/config/sui.ts

// Configuración final actualizada para Testnet
export const suiConfig = {
  // --- IDs de los PAQUETES (Actualizados de tus logs de publicación) ---
  packageId: "0xea217e700d2aa262cd91b7cbcccb899b976a1f2d7b63d700a860a7cdd4003286", // tokentrip_experiences
  auctionsPackageId: "0xb0b85843bc219692ee6c35cdf43606568cdb23fe66a78ab9d6b753d8ec59c47c",
  lendingPackageId: "0x1806798da34dc3a1624cd319ae37668bc684580b43d5d13a0b064b29b8ef43dc",
  rentalPackageId: "0x78394a41097c40053bcbf56f77804685469813e0274e7369e2d593d982885f8f",
  
  // --- IDs de paquetes que NO cambiaron (dependencias) ---
  tktPackageId: "0xed46584d450fc173a7796cdbc934248df25f0d46700a3a852fb025f1d9a000b3",
  daoPackageId: "0xfa1a5a8c8f307f3bac14acd7b182ffef7fa5c28fc7fa905877127944e0339448",
  stakingPackageId: "0xa94086668b5f56276dc40656b5afd660662bb18d1e4f2292bff11000591cf42a",
  
  // --- IDs de OBJETOS creados por la función init ---

  // Creados por la última versión de `tokentrip_experiences` (packageId)
  adminCapId: "0xf6aa20625038bb7386b6d04de15e08200d5760b5d80ff051a4d0bc36575c2696",
  vipRegistryId: "0x89437b91ff4abfdec5bacc790e405df02d36d650be40ddf7b3a6d01c43599b73",

  // IDs de objetos de otros paquetes (asumiendo que no se han vuelto a publicar)
  stakingPoolId: "0x1f10f55a350e29250a99bf76cf7d448df10474c190e87c9e1a974b58ebc06b67",
  daoId: "0x4163a637cead726b319dcc9c615c30fdeff6f11fa5e5efe9b5682d234c12a565",
  daoTreasuryId: "0xa4340e33c324e4899e372e1760c10561f575a58c8e697a1d7a6d6b0aae5ef9c2",
  tktTreasuryCapId: "0x2e0243fa40a462818771ca439bfd00ec613c27e83c29edc862f6f96ea985dfd1",

  // IDs externos (no cambian)
  cetusSuiWalPoolId: "0x72eaf5b60fadc6a7f0ecd81b067824fda96844a049a3c1ddb4bbca00c22fa992",
};