// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plane } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConnectButton } from '@mysten/dapp-kit';

export function Navbar() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center space-x-3">
          <div className="w-9 h-9 sui-gradient rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold heading-gradient">
            TokenTrip
          </span>
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          <Link href={`/${locale}#explorar`} className="text-muted-foreground hover:text-foreground transition-colors">Explorar</Link>
          <Link href={`/${locale}/staking`} className="text-muted-foreground hover:text-foreground transition-colors">Staking</Link>
          <Link href={`/${locale}/auctions`} className="text-muted-foreground hover:text-foreground transition-colors">Subastas</Link>
          <Link href={`/${locale}/governance`} className="text-muted-foreground hover:text-foreground transition-colors">DAO</Link>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
