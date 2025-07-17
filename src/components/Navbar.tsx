'use client';

import Link from 'next/link';
// --- CORRECCIÓN: Se importa useParams ---
import { usePathname, useParams } from 'next/navigation';
import { useState } from 'react';
import { Plane, Menu, X, User, LogOut, LayoutDashboard, Settings, HandCoins } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from './ui/button';
import { ConnectModal } from './ConnectModal'; 
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useZkLoginState } from '@/context/ZkLoginContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from './ui/avatar';


export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- CORRECCIÓN: Se obtiene el locale actual de la URL ---
  const params = useParams();
  const locale = params.locale;

  const traditionalAccount = useCurrentAccount();
  const { user: zkLoginUser, logout: zkLogout } = useZkLoginState();
  const { mutate: disconnect } = useDisconnectWallet();

  const currentAccount = traditionalAccount || zkLoginUser;

  const handleLogout = () => {
    if (traditionalAccount) {
        disconnect();
    }
    if (zkLoginUser) {
        zkLogout();
    }
  }

  // --- CORRECCIÓN: Los enlaces ahora son dinámicos ---
  const navLinks = [
    { href: `/${locale}/auctions`, label: 'Auctions' },
    { href: `/${locale}/governance`, label: 'DAO' },
    { href: `/${locale}/provider/register-provider`, label: 'For Providers' },
  ];

  const UserButton = () => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 glass-effect" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Connected</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                        {currentAccount?.address}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* --- CORRECCIÓN: Los enlaces ahora son dinámicos --- */}
              <Link href={`/${locale}/dashboard`}>
                <DropdownMenuItem>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>My Dashboard</span>
                </DropdownMenuItem>
              </Link>
              <Link href={`/${locale}/staking`}>
                <DropdownMenuItem>
                  <HandCoins className="mr-2 h-4 w-4" />
                  <span>Staking</span>
                </DropdownMenuItem>
              </Link>
              <Link href={`/${locale}/dashboard/notifications`}>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
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
          {/* --- CORRECCIÓN: El enlace del logo ahora es dinámico --- */}
          <Link href={`/${locale}`} className="flex items-center space-x-3">
            <div className="w-9 h-9 sui-gradient rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold heading-gradient">TokenTrip</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors ${ pathname === link.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground' }`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:block">
              {currentAccount ? <UserButton /> : <ConnectModal />}
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

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[61px] z-40 bg-background/95 backdrop-blur-lg">
           <div className="sm:hidden p-4 border-b border-white/10 flex justify-center">
              {currentAccount ? <UserButton /> : <ConnectModal />}
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