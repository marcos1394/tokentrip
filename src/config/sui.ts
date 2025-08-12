// src/config/sui.ts

// Configuración final y verificada para Testnet
export const suiConfig = {
  // --- IDs de los PAQUETES (Corregidos según el último despliegue) ---
    // --- IDs de los PAQUETES (Actualizados de tus logs de publicación) ---
  packageId: "0x098d0eaaf37e58802bf7f540303411eb5b724ffd64e078761c6785f24caf2aa2", // tokentrip_experiences
  auctionsPackageId: "0x3f4e1dd8bcd73c32eba9334b608f12f7edafa4cac3d6129f0f9b16e94b3f7c5e",
  lendingPackageId: "0xeafa5efcb85f83cf6ac6e8886e7f91eeb4a49f7edba6f7450c8d444698e0c8c7",
  rentalPackageId: "0x17479d2b50ccf5dfc3ac69bb452716bf23c3a28c8aa22c82f48abd321a86a639",
  
  // --- IDs de paquetes que NO cambiaron (dependencias) ---
  tktPackageId: "0xed46584d450fc173a7796cdbc934248df25f0d46700a3a852fb025f1d9a000b3",
  daoPackageId: "0xfa1a5a8c8f307f3bac14acd7b182ffef7fa5c28fc7fa905877127944e0339448",
  stakingPackageId: "0xa94086668b5f56276dc40656b5afd660662bb18d1e4f2292bff11000591cf42a",
  
  // --- IDs de OBJETOS creados por la función init ---

  // Creados por la última versión de `tokentrip_experiences` (packageId)
  adminCapId: "0xc6f110e1a73d4d5bdcc9567c30a41cc96381c6f5d3d98cb857a9aea83db7ab9e",
  vipRegistryId: "0x96ae339f6c6eae2426e6e126ca0739472fd86ccc58310e9e5e2c4e54644bf51d",

  // IDs de objetos de otros paquetes (asumiendo que no se han vuelto a publicar)
  stakingPoolId: "0x1f10f55a350e29250a99bf76cf7d448df10474c190e87c9e1a974b58ebc06b67",
  daoId: "0x4163a637cead726b319dcc9c615c30fdeff6f11fa5e5efe9b5682d234c12a565",
  daoTreasuryId: "0xa4340e33c324e4899e372e1760c10561f575a58c8e697a1d7a6d6b0aae5ef9c2",
  tktTreasuryCapId: "0x2e0243fa40a462818771ca439bfd00ec613c27e83c29edc862f6f96ea985dfd1",

  // IDs externos (no cambian)
  cetusSuiWalPoolId: "0x72eaf5b60fadc6a7f0ecd81b067824fda96844a049a3c1ddb4bbca00c22fa992",
  suiTktPoolId: "0x97a0b6e8b06106887c7f85afce869a07f87bf05ebb94ea5ed63a0cbfebfd7590", 

};