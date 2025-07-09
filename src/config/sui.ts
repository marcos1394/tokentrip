// src/config/sui.ts

// Se eliminó la dependencia de 'process.env' para depurar.
// Los valores están directamente "hardcodeados" en el código.

export const suiConfig = {
  // Marketplace V1/V2
  packageId: "0x3087ed992e1acd9fdfd4e57bfebcbc56e6b7b3cc2d7e9feb48e512a49cad539b",
  treasuryCapId: "0x9e3962843855af3fefbcbb9e43c7a727ed37ec79eed7d5c595f75f00c81fa688",
  stakingPoolId: "0x6f3495eb15cf6fead11d8fb47fcfff032770e48c776498136731c57469365072",
  
  // Admin & VIP
  adminCapId: "0x0467acdf72b35ad21dd8bcd3648170db212ccb5a8fcdfa8b2ab811195440d690",
  vipRegistryId: "0xPLACEHOLDER_VIP_REGISTRY_ID",

  // TKT Token
  tktPackageId: "0x3087ed992e1acd9fdfd4e57bfebcbc56e6b7b3cc2d7e9feb48e512a49cad539b",

  // DAO
  daoPackageId: "0x3087ed992e1acd9fdfd4e57bfebcbc56e6b7b3cc2d7e9feb48e512a49cad539b",
  daoId: "0xPLACEHOLDER_DAO_ID",
  daoTreasuryId: "0xPLACEHOLDER_DAO_TREASURY_ID",
};