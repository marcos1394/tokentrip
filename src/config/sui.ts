// src/config/sui.ts

// Configuración actualizada para Testnet (9 de Agosto, 2025)
export const suiConfig = {
  // --- IDs de los PAQUETES ---
  packageId: "0x0141354486cba5c4f386fe083129cc7c3f0486c25aca311a8547a68469557d8e", // tokentrip_experiences
  auctionsPackageId: "0x75fb90da36493fb9aadb7fc525a025035007174cbe71f79c9c0fe5aabe4fe888",
  lendingPackageId: "0x30d34f7ccd5e972a957a78c4bf90b7f3ab54cbeadb8506ca3795787acf75891d",
  rentalPackageId: "0xf6f3979387d52bdcc3c53992c2611a27a9f5c31ca988977d14382e801457cca9",

  // --- IDs de paquetes que NO cambiaron (dependencias) ---
  tktPackageId: "0xed46584d450fc173a7796cdbc934248df25f0d46700a3a852fb025f1d9a000b3",
  daoPackageId: "0xfa1a5a8c8f307f3bac14acd7b182ffef7fa5c28fc7fa905877127944e0339448",
  stakingPackageId: "0xa94086668b5f56276dc40656b5afd660662bb18d1e4f2292bff11000591cf42a",

  // --- IDs de OBJETOS creados por la función init ---

  // Creados por `tokentrip_experiences` (packageId)
  // NOTA: Los object IDs también se generan de nuevo cada vez.
  // He sacado los nuevos IDs de tus logs.
  adminCapId: "0xe42816c8384ba9a15b7ae415ca6de005cb8aaa1bb203996254e690c230134fe3",
  vipRegistryId: "0xe1945bd96977f2f0554e5c88b4cf392d1082c8c3be11e1524be2ec0ca1f3d311",
  
  // IDs de objetos de otros paquetes (asumiendo que no se han vuelto a publicar)
  // Si también los volviste a publicar, necesitarás actualizar estos también.
  stakingPoolId: "0x1f10f55a350e29250a99bf76cf7d448df10474c190e87c9e1a974b58ebc06b67",
  daoId: "0x4163a637cead726b319dcc9c615c30fdeff6f11fa5e5efe9b5682d234c12a565",
  daoTreasuryId: "0xa4340e33c324e4899e372e1760c10561f575a58c8e697a1d7a6d6b0aae5ef9c2",
  tktTreasuryCapId: "0x2e0243fa40a462818771ca439bfd00ec613c27e83c29edc862f6f96ea985dfd1",

  // IDs externos (no cambian)
  cetusSuiWalPoolId: "0x72eaf5b60fadc6a7f0ecd81b067824fda96844a049a3c1ddb4bbca00c22fa992",
};