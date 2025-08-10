// src/config/sui.ts

// Configuración final y verificada para Testnet
export const suiConfig = {
  // --- IDs de los PAQUETES (Corregidos según el último despliegue) ---
  packageId: "0x7c58a8f35419a88cdb406993397ea17b68f7e082b79ad187b4d6e084025b4267", // tokentrip_experiences
  auctionsPackageId: "0x395c38b7485fb889ab107288a3f85199aefb88d936945d1e31881d868b45641f",
  lendingPackageId: "0x44a1a9d319e18b55d1b700401fdc9d9ea0622a28e173df46658c180363c35835",
  rentalPackageId: "0xd0619b97e155e8a20e5aded82c8617e3bb910e9496518873ea14df8f71b94edc",
  
  // --- IDs de paquetes que NO cambiaron (dependencias) ---
  tktPackageId: "0xed46584d450fc173a7796cdbc934248df25f0d46700a3a852fb025f1d9a000b3",
  daoPackageId: "0xfa1a5a8c8f307f3bac14acd7b182ffef7fa5c28fc7fa905877127944e0339448",
  stakingPackageId: "0xa94086668b5f56276dc40656b5afd660662bb18d1e4f2292bff11000591cf42a",
  
  // --- IDs de OBJETOS creados por la función init ---

  // Creados por la última versión de `tokentrip_experiences` (packageId)
  adminCapId: "0xcb576a164d8946d0941d265e3e47bb24849b5dc20fb820df6433f4c424700237",
  vipRegistryId: "0x89437b91ff4abfdec5bacc790e405df02d36d650be40ddf7b3a6d01c43599b73",

  // IDs de objetos de otros paquetes (asumiendo que no se han vuelto a publicar)
  stakingPoolId: "0x1f10f55a350e29250a99bf76cf7d448df10474c190e87c9e1a974b58ebc06b67",
  daoId: "0x4163a637cead726b319dcc9c615c30fdeff6f11fa5e5efe9b5682d234c12a565",
  daoTreasuryId: "0xa4340e33c324e4899e372e1760c10561f575a58c8e697a1d7a6d6b0aae5ef9c2",
  tktTreasuryCapId: "0x2e0243fa40a462818771ca439bfd00ec613c27e83c29edc862f6f96ea985dfd1",

  // IDs externos (no cambian)
  cetusSuiWalPoolId: "0x72eaf5b60fadc6a7f0ecd81b067824fda96844a049a3c1ddb4bbca00c22fa992",
};