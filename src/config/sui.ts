// src/config/sui.ts

// Configuración final actualizada para Testnet
export const suiConfig = {
  // --- IDs de los PAQUETES (Actualizados de tus logs de publicación) ---
  packageId: "0x7977a8b3cdc4965c222afe5d877984b2fcec5086d0b6baa705cf760e10cda789", // tokentrip_experiences
  auctionsPackageId: "0x670d467dc02ce9a85850952f9b68889f4a7bc398b07b0f2cdca5a038038bb795",
  lendingPackageId: "0x7eeeba78e8bc89fa742d0d53d2b2de0f12851ee872848c812e862f4566f46edc",
  rentalPackageId: "0x2ff86f9aa8e2e00c61ca0e72a0e33334e1339a7f183f9d4f8ce36ab7a49a53f7",
  
  // --- IDs de paquetes que NO cambiaron (dependencias) ---
  tktPackageId: "0xed46584d450fc173a7796cdbc934248df25f0d46700a3a852fb025f1d9a000b3",
  daoPackageId: "0xfa1a5a8c8f307f3bac14acd7b182ffef7fa5c28fc7fa905877127944e0339448",
  stakingPackageId: "0xa94086668b5f56276dc40656b5afd660662bb18d1e4f2292bff11000591cf42a",
  
  // --- IDs de OBJETOS creados por la función init ---

  // Creados por `tokentrip_experiences` (packageId)
  adminCapId: "0x5127060776285f306837e8ccfa857e3d42ded8af73e6f28b7bdce50951ae853d",
  vipRegistryId: "0xb7290163351981a4d0482b6b02a24687d7f7690623253724a2c5121408882ca6",

  // IDs de objetos de otros paquetes (asumiendo que no se han vuelto a publicar)
  stakingPoolId: "0x1f10f55a350e29250a99bf76cf7d448df10474c190e87c9e1a974b58ebc06b67",
  daoId: "0x4163a637cead726b319dcc9c615c30fdeff6f11fa5e5efe9b5682d234c12a565",
  daoTreasuryId: "0xa4340e33c324e4899e372e1760c10561f575a58c8e697a1d7a6d6b0aae5ef9c2",
tktTreasuryCapId: "0x2e0243fa40a462818771ca439bfd00ec613c27e83c29edc862f6f96ea985dfd1",

  // IDs externos (no cambian)
  cetusSuiWalPoolId: "0x72eaf5b60fadc6a7f0ecd81b067824fda96844a049a3c1ddb4bbca00c22fa992",
};