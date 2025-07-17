'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// La interfaz para el estado en memoria de la aplicación
export interface ZkLoginState {
  address: string;
  userSignature: string;
  ephemeralKeyPair: Ed25519Keypair;
}

// --- MODIFICADO: Interfaz para lo que guardamos en sessionStorage ---
// No podemos guardar el objeto Keypair, así que guardamos su llave secreta como string.
interface StoredZkLoginState {
  address: string;
  userSignature: string;
  ephemeralSecretKey: string; // Se guarda la llave secreta en formato string
}

interface ZkLoginContextType {
  user: ZkLoginState | null;
  login: (data: ZkLoginState) => void;
  logout: () => void;
}

const ZkLoginContext = createContext<ZkLoginContextType | undefined>(undefined);

const ZK_LOGIN_SESSION_KEY = 'zk-login-session';

export function ZkLoginProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ZkLoginState | null>(null);

  // --- CORREGIDO: Carga la sesión usando fromSecretKey ---
  useEffect(() => {
    const storedSession = sessionStorage.getItem(ZK_LOGIN_SESSION_KEY);
    if (storedSession) {
      const parsed: StoredZkLoginState = JSON.parse(storedSession);
      setUser({
        address: parsed.address,
        userSignature: parsed.userSignature,
        ephemeralKeyPair: Ed25519Keypair.fromSecretKey(parsed.ephemeralSecretKey),
      });
    }
  }, []);

  // --- CORREGIDO: `login` ahora guarda usando getSecretKey ---
  const login = (data: ZkLoginState) => {
    setUser(data);
    const dataToStore: StoredZkLoginState = {
      address: data.address,
      userSignature: data.userSignature,
      ephemeralSecretKey: data.ephemeralKeyPair.getSecretKey(),
    };
    sessionStorage.setItem(ZK_LOGIN_SESSION_KEY, JSON.stringify(dataToStore));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(ZK_LOGIN_SESSION_KEY);
  };

  return (
    <ZkLoginContext.Provider value={{ user, login, logout }}>
      {children}
    </ZkLoginContext.Provider>
  );
}

export function useZkLoginState() {
  const context = useContext(ZkLoginContext);
  if (context === undefined) {
    throw new Error('useZkLoginState must be used within a ZkLoginProvider');
  }
  return context;
}