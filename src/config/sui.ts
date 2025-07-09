// src/config/sui.ts

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
};

// CORRECCIÓN: Todas las llamadas usan variables que empiezan con NEXT_PUBLIC_
export const suiConfig = {
  // Marketplace V1/V2
  packageId: requiredEnv('NEXT_PUBLIC_PACKAGE_ID'),
  treasuryCapId: requiredEnv('NEXT_PUBLIC_TREASURY_CAP_ID'),
  stakingPoolId: requiredEnv('NEXT_PUBLIC_STAKING_POOL_ID'),
  
  // Admin & VIP
  adminCapId: requiredEnv('NEXT_PUBLIC_ADMIN_CAP_ID'),
  vipRegistryId: requiredEnv('NEXT_PUBLIC_VIP_REGISTRY_ID'),

  // TKT Token
  tktPackageId: requiredEnv('NEXT_PUBLIC_TKT_PACKAGE_ID'),

  // DAO
  daoPackageId: requiredEnv('NEXT_PUBLIC_DAO_PACKAGE_ID'),
  daoId: requiredEnv('NEXT_PUBLIC_DAO_ID'),
  daoTreasuryId: requiredEnv('NEXT_PUBLIC_DAO_TREASURY_ID'),
};