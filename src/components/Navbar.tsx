'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Plane, Menu, X, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from './ui/button';
import { ConnectModal } from './ConnectModal'; 
// --- AÑADIDO: Hooks para gestionar el estado de la billetera ---
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- AÑADIDO: Lógica para el estado de conexión ---
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  const navLinks = [
    { href: '/#explore', label: 'Explore' },
    { href: '/staking', label: 'Staking' },
    { href: '/auctions', label: 'Auctions' },
    { href: '/governance', label: 'DAO' },
  ];

  const UserButton = () => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                    {/* En un futuro, el avatar podría venir del perfil del usuario */}
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 glass-effect" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Connected</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                        {account?.address}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => disconnect()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 sui-gradient rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold heading-gradient">TokenTrip</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors ${ pathname === link.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground' }`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:block">
              {/* --- CORRECCIÓN: Renderizado condicional --- */}
              {account ? <UserButton /> : <ConnectModal />}
            </div>
            <ThemeToggle />
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Menú Overlay para Móvil */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[61px] z-40 bg-background/95 backdrop-blur-lg">
           <div className="sm:hidden p-4 border-b border-white/10">
              {/* --- CORRECCIÓN: Renderizado condicional también en móvil --- */}
              {account ? <UserButton /> : <ConnectModal />}
            </div>
          <div className="container mx-auto px-4 py-8 flex flex-col space-y-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-xl font-semibold text-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
