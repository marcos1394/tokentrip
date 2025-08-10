// src/config/sui.ts

// Configuración final actualizada para Testnet
export const suiConfig = {
  // --- IDs de los PAQUETES (Actualizados de tus logs de publicación) ---
  packageId: "0xcea6a3334cb989a2a7462c1fc22a43f87484bde7e51c6acf4a7e72ac1da04368", // tokentrip_experiences
  auctionsPackageId: "0xa2de509885620271f1bee4e39582f5edb9bd5c446a7107e8da782b2e08fb34b9",
  lendingPackageId: "0xe15e4b8e898f16034106345409280a30408c6b71c776e71345f6635390defde9",
  rentalPackageId: "0xb49d58b4b84f995e14ee95ac549ac9dc8dc6dca9ebee6ab5fd02c9587f13224a",
  
  // --- IDs de paquetes que NO cambiaron (dependencias) ---
  tktPackageId: "0xed46584d450fc173a7796cdbc934248df25f0d46700a3a852fb025f1d9a000b3",
  daoPackageId: "0xfa1a5a8c8f307f3bac14acd7b182ffef7fa5c28fc7fa905877127944e0339448",
  stakingPackageId: "0xa94086668b5f56276dc40656b5afd660662bb18d1e4f2292bff11000591cf42a",
  
  // --- IDs de OBJETOS creados por la función init ---

  // Creados por `tokentrip_experiences` (packageId)
  adminCapId: "0x9130b9cdbf04339db4805557ba594b39472b853724a63b05c7ec1b508cc63387",
  vipRegistryId: "0x699c39c90a853e536260b16662074df63b18e69654583b0c59ad3345b5430728",

  // IDs de objetos de otros paquetes (asumiendo que no se han vuelto a publicar)
  stakingPoolId: "0x1f10f55a350e29250a99bf76cf7d448df10474c190e87c9e1a974b58ebc06b67",
  daoId: "0x4163a637cead726b319dcc9c615c30fdeff6f11fa5e5efe9b5682d234c12a565",
  daoTreasuryId: "0xa4340e33c324e4899e372e1760c10561f575a58c8e697a1d7a6d6b0aae5ef9c2",
  tktTreasuryCapId: "0x2e0243fa40a462818771ca439bfd00ec613c27e83c29edc862f6f96ea985dfd1",

  // IDs externos (no cambian)
  cetusSuiWalPoolId: "0x72eaf5b60fadc6a7f0ecd81b067824fda96844a049a3c1ddb4bbca00c22fa992",
};