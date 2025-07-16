// src/context/ZkLoginContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Define el tipo de datos que guardaremos para nuestro usuario zkLogin
interface ZkLoginState {
  address: string;
  userSignature: string; // <-- Nombre corregido y tipo específico
  ephemeralKeyPair: Ed25519Keypair;
}
// Define el tipo del contexto
interface ZkLoginContextType {
  user: ZkLoginState | null;
  login: (data: ZkLoginState) => void;
  logout: () => void;
}

// Crea el contexto
const ZkLoginContext = createContext<ZkLoginContextType | undefined>(undefined);

// Crea el proveedor del contexto
export function ZkLoginProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ZkLoginState | null>(null);

  const login = (data: ZkLoginState) => setUser(data);
  const logout = () => setUser(null);

  return (
    <ZkLoginContext.Provider value={{ user, login, logout }}>
      {children}
    </ZkLoginContext.Provider>
  );
}

// Hook personalizado para usar el contexto fácilmente
export function useZkLoginState() {
  const context = useContext(ZkLoginContext);
  if (context === undefined) {
    throw new Error('useZkLoginState must be used within a ZkLoginProvider');
  }
  return context;
}
