'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useState } from 'react';
import { Plane, Menu, X, User, LogOut, LayoutDashboard, Settings, HandCoins, ArrowLeftRight } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // <-- Importar Tabs
import { MiniSwap } from './MiniSwap';
import { suiConfig } from '@/config/sui'; // <-- Importar la configuración

// Definimos los tipos de moneda fuera del componente
const SUI_COIN_TYPE = '0x2::sui::SUI';
const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';
const TKT_COIN_TYPE = `${suiConfig.tktPackageId}::tkt::TKT`;


export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwapSheetOpen, setIsSwapSheetOpen] = useState(false);
  
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
            <DropdownMenuItem onClick={() => setIsSwapSheetOpen(true)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                <span>Swap Tokens</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
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
            {currentAccount && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsSwapSheetOpen(true)}
                className="flex items-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Swap</span>
              </Button>
            )}
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

      {/* --- SHEET MODIFICADO CON TABS PARA EL MINISWAP --- */}
      <Sheet open={isSwapSheetOpen} onOpenChange={setIsSwapSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Swap Tokens</SheetTitle>
            <SheetDescription>
              Intercambia SUI por los tokens del ecosistema TokenTrip.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            {currentAccount ? (
              <Tabs defaultValue="tkt" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tkt">Get TKT</TabsTrigger>
                  <TabsTrigger value="wal">Get WAL</TabsTrigger>
                </TabsList>
                <TabsContent value="tkt">
                  <div className="mt-4">
                    <MiniSwap
                        poolId={suiConfig.suiTktPoolId}
                        fromCoinType={SUI_COIN_TYPE}
                        fromCoinDecimals={9}
                        fromCoinSymbol="SUI"
                        toCoinType={TKT_COIN_TYPE}
                        toCoinDecimals={9}
                        toCoinSymbol="TKT"
                        onSwapSuccess={() => setIsSwapSheetOpen(false)}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="wal">
                    <div className="mt-4">
                        <MiniSwap
                            poolId={suiConfig.cetusSuiWalPoolId}
                            fromCoinType={SUI_COIN_TYPE}
                            fromCoinDecimals={9}
                            fromCoinSymbol="SUI"
                            toCoinType={WAL_COIN_TYPE}
                            toCoinDecimals={9}
                            toCoinSymbol="WAL"
                            onSwapSuccess={() => setIsSwapSheetOpen(false)}
                        />
                    </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Please connect your wallet to swap tokens.</p>
                <div className="mt-4"><ConnectModal /></div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
            {currentAccount && (
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSwapSheetOpen(true);
                }}
                className="text-xl font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span>Swap Tokens</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}