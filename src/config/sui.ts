// src/config/sui.ts

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
};

// Usamos placeholders. Estos serán reemplazados con los IDs reales después de desplegar.
export const suiConfig = {
  // Marketplace V1/V2
  packageId: requiredEnv('NEXT_PUBLIC_PACKAGE_ID') || "0xPLACEHOLDER",
  treasuryCapId: requiredEnv('NEXT_PUBLIC_TREASURY_CAP_ID') || "0xPLACEHOLDER",
  stakingPoolId: requiredEnv('NEXT_PUBLIC_STAKING_POOL_ID') || "0xPLACEHOLDER",
  
  // Admin & VIP
  adminCapId: requiredEnv('NEXT_PUBLIC_ADMIN_CAP_ID') || "0xPLACEHOLDER",
  vipRegistryId: requiredEnv('NEXT_PUBLIC_VIP_REGISTRY_ID') || "0xPLACEHOLDER",

  // TKT Token
  tktPackageId: requiredEnv('TKT_PACKAGE_ID') || "0xPLACEHOLDER",

  // DAO
  daoPackageId: requiredEnv('NEXT_PUBLIC_DAO_PACKAGE_ID') || "0xPLACEHOLDER",
  daoId: requiredEnv('NEXT_PUBLIC_DAO_ID') || "0xPLACEHOLDER",
  daoTreasuryId: requiredEnv('NEXT_PUBLIC_DAO_TREASURY_ID') || "0xPLACEHOLDER",
};
