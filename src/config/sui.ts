// src/config/sui.ts

// Configuración final actualizada para Testnet
export const suiConfig = {
  // --- IDs de los PAQUETES (Actualizados de tus logs de publicación) ---
  packageId: "0x73d33c77d5c230f61ec285651d434c2950c79026a25a89b674f9e4239e51e239", // tokentrip_experiences
  auctionsPackageId: "0xb8ff98bb8fe4b48983316b43ab72dfccace3a5a58f607cb4fada1b61b71a635e",
  lendingPackageId: "0x03f12e226ba53532e302302856839a24cc033cf5c28965ce0a045e6581a21e73",
  rentalPackageId: "0x43a3911dcfba3b8efe324fec02f2c59a1e87f73c2b30349fbf8c345b46a781fd",
  
  // --- IDs de paquetes que NO cambiaron (dependencias) ---
  tktPackageId: "0xed46584d450fc173a7796cdbc934248df25f0d46700a3a852fb025f1d9a000b3",
  daoPackageId: "0xfa1a5a8c8f307f3bac14acd7b182ffef7fa5c28fc7fa905877127944e0339448",
  stakingPackageId: "0xa94086668b5f56276dc40656b5afd660662bb18d1e4f2292bff11000591cf42a",
  
  // --- IDs de OBJETOS creados por la función init ---

  // Creados por `tokentrip_experiences` (packageId)
  adminCapId: "0xf45ce66dcc9c915bdd555086c881c6aceed06c74eb1b21e8c6b9473685b68d89",
  vipRegistryId: "0x860aea43f0f30cf968b8dbb56c27d218aaa2941c03473a147d2d5d76ee201ab8",

  // IDs de objetos de otros paquetes (asumiendo que no se han vuelto a publicar)
  stakingPoolId: "0x1f10f55a350e29250a99bf76cf7d448df10474c190e87c9e1a974b58ebc06b67",
  daoId: "0x4163a637cead726b319dcc9c615c30fdeff6f11fa5e5efe9b5682d234c12a565",
  daoTreasuryId: "0xa4340e33c324e4899e372e1760c10561f575a58c8e697a1d7a6d6b0aae5ef9c2",
  tktTreasuryCapId: "0x2e0243fa40a462818771ca439bfd00ec613c27e83c29edc862f6f96ea985dfd1",

  // IDs externos (no cambian)
  cetusSuiWalPoolId: "0x72eaf5b60fadc6a7f0ecd81b067824fda96844a049a3c1ddb4bbca00c22fa992",
};