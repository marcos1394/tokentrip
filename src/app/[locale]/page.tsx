"use client"

// Componentes de la página
import { AnimatedBackground } from "@/components/animated-background";
import { HeroSection } from "@/components/landing/HeroSection";
import { MyExperiencesSection } from "@/components/landing/MyExperiencesSection";
import { ExploreSection } from "@/components/landing/ExploreSection";
import { FifaSection } from "@/components/landing/FifaSection";
import { TokenizationSection } from "@/components/landing/TokenizationSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { CtaSection } from "@/components/landing/CtaSection";
import { MyFractionsSection } from "@/components/MyFractionsSection"; // Se importa el nuevo contenedor

export default function HomePage() {
  // Ya no necesita lógica, solo ensambla los componentes.
  return (
    <div>
      <AnimatedBackground />
      
      {/* El Navbar y el Footer son globales y se renderizan desde el layout.tsx.
        La HomePage solo se preocupa de su propio contenido, en orden.
      */}
      
      <HeroSection />
      <MyExperiencesSection />
      <MyFractionsSection />
      <ExploreSection />
      <FifaSection />
      <TokenizationSection />
      <StatsSection />
      <SecuritySection />
      <CtaSection />
    </div>
  )
}