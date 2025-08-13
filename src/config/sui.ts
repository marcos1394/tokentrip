// src/config/sui.ts

// Configuración final actualizada para Testnet
export const suiConfig = {
  // --- IDs de los PAQUETES (Actualizados de tus logs de publicación) ---
  packageId: "0x08408958a63d105c1154f378afd055525db45f060c48e4565ed5432a04a83638", // tokentrip_experiences
  auctionsPackageId: "0xff7ce28606fd792a48a9b0ad68fc5ee94f3779f3c79742ca1ec9791d86c0a589",
  lendingPackageId: "0xcfdec512a25fafc773b7d9576524f0e7cf6ff2b679739dee0f44b005ecbcab77",
  rentalPackageId: "0x0f248cfc7a5555fcb71b7bf8c5197d5534914895de63f109f6038fcedd46aee4",
  
  // --- IDs de paquetes que NO cambiaron (dependencias) ---
  tktPackageId: "0xed46584d450fc173a7796cdbc934248df25f0d46700a3a852fb025f1d9a000b3",
  daoPackageId: "0xfa1a5a8c8f307f3bac14acd7b182ffef7fa5c28fc7fa905877127944e0339448",
  stakingPackageId: "0xa94086668b5f56276dc40656b5afd660662bb18d1e4f2292bff11000591cf42a",
  
  // --- IDs de OBJETOS creados por la función init ---

  // Creados por la última versión de `tokentrip_experiences` (packageId)
  adminCapId: "0x927c89aeace97e1eccda330bf7a19db61c983048ffa58dc510a49264cb9c7940",
  vipRegistryId: "0x7ebf5cb5cbecd80904a14b6518b3a275aa9913dba1f25e2b9990fcd10aec17ff",

  // IDs de objetos de otros paquetes (asumiendo que no se han vuelto a publicar)
  stakingPoolId: "0x1f10f55a350e29250a99bf76cf7d448df10474c190e87c9e1a974b58ebc06b67",
  daoId: "0x4163a637cead726b319dcc9c615c30fdeff6f11fa5e5efe9b5682d234c12a565",
  daoTreasuryId: "0xa4340e33c324e4899e372e1760c10561f575a58c8e697a1d7a6d6b0aae5ef9c2",
  tktTreasuryCapId: "0x2e0243fa40a462818771ca439bfd00ec613c27e83c29edc862f6f96ea985dfd1",

  // IDs de Pools de Liquidez (asumiendo que los pools no se han vuelto a crear)
  cetusSuiWalPoolId: "0x72eaf5b60fadc6a7f0ecd81b067824fda96844a049a3c1ddb4bbca00c22fa992",
  suiTktPoolId: "0x97a0b6e8b06106887c7f85afce869a07f87bf05ebb94ea5ed63a0cbfebfd7590",
};