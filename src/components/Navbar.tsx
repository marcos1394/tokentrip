'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Plane, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from './ui/button';
// 1. Se importa el nuevo ConnectModal
import { ConnectModal } from './ConnectModal'; 

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/#explore', label: 'Explore' },
    { href: '/staking', label: 'Staking' },
    { href: '/auctions', label: 'Auctions' },
    { href: '/governance', label: 'DAO' },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 sui-gradient rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold heading-gradient">
              TokenTrip
            </span>
          </Link>

          {/* Navegación para Escritorio */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Acciones y Menú Móvil */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:block">
              {/* 2. Se reemplaza ConnectButton con ConnectModal */}
              <ConnectModal />
            </div>
            <ThemeToggle />
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
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
              {/* 3. Se reemplaza ConnectButton con ConnectModal también aquí */}
              <ConnectModal />
            </div>
          <div className="container mx-auto px-4 py-8 flex flex-col space-y-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}