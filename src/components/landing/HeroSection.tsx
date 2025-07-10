// src/components/landing/HeroSection.tsx

'use client'; // <-- Se necesita para usar hooks

import { useTypewriter, Cursor } from 'react-simple-typewriter';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Zap, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  // 1. Hook de useTypewriter
  const [text] = useTypewriter({
    words: ['Your Adventures.', 'Your Tickets.', 'Your Memberships.', 'Your Assets.'],
    loop: true,
    typeSpeed: 100,
    deleteSpeed: 70,
    delaySpeed: 1500,
  });

  return (
    <section id="home" className="relative text-center pt-36 pb-24 px-4 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse animation-delay-4000" />
        
        <div className="relative z-10">
            <Badge className="mb-6" variant="secondary">The Experience Economy, Reimagined</Badge>
            
            {/* 2. Encabezado con efecto de escritura */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance h-36 md:h-48 flex flex-col justify-center items-center">
              <span>Own, Trade & Fractionalize</span>
              <span className="heading-gradient">
                {text}
                <Cursor cursorStyle='_' />
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto text-balance">
              The first platform on Sui that transforms real-world experiences into dynamic, tradable digital assets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="btn-sui px-8 py-6 text-lg">
                <Link href="/#explore">
                  <Zap className="w-5 h-5 mr-2" />
                  Explore Marketplace
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="btn-sui-outline px-8 py-6 text-lg">
                <Link href="/#how-it-works">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Learn How
                </Link>
              </Button>
            </div>
        </div>
    </section>
  );
}