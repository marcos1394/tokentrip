// src/components/Footer.tsx
// NOTA: Se ha eliminado 'use client' porque ya no se necesitan hooks.
// Este ahora es un Componente de Servidor, lo cual es mejor para el rendimiento.

import { Plane, Twitter, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { href: '#', icon: Twitter, label: 'Twitter' },
    { href: '#', icon: Send, label: 'Telegram' },
    { href: '#', icon: MessageSquare, label: 'Discord' }, // Lucide no tiene icono de Discord, usamos uno genérico
  ];

  return (
    <footer className="py-12 px-4 border-t bg-slate-100/50 dark:bg-slate-900/20">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-muted-foreground">
          
          {/* Columna de Branding */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 sui-gradient rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold heading-gradient">TokenTrip</span>
            </Link>
            <p className="text-sm max-w-xs">
              The decentralized marketplace for real-world experiences, powered by the Sui blockchain. Own, trade, and fractionalize your adventures.
            </p>
          </div>

          {/* Columna de Producto */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/#explore" className="hover:text-primary transition-colors">Explore</Link></li>
              <li><Link href="/staking" className="hover:text-primary transition-colors">Staking</Link></li>
              <li><Link href="/governance" className="hover:text-primary transition-colors">DAO</Link></li>
              <li><Link href="/auctions" className="hover:text-primary transition-colors">Auctions</Link></li>
            </ul>
          </div>

          {/* Columna de Recursos */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Status</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
            </ul>
          </div>
          
          {/* Columna de Comunidad */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-foreground mb-4">Community</h4>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.label} 
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} TokenTrip. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}