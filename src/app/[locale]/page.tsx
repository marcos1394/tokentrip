"use client"

// Componentes de la página
import { AnimatedBackground } from "@/components/animated-background";
import { HeroSection } from "@/components/HeroSection";
import { MyExperiencesSection } from "@/components/MyExperiencesSection";
import { ExploreSection } from "@/components/ExploreSection";
import { FifaSection } from "@/components/FifaSection";
import { TokenizationSection } from "@/components/TokenizationSection";
import { StatsSection } from "@/components/StatsSection";
import { SecuritySection } from "@/components/SecuritySection";
import { CtaSection } from "@/components/CtaSection";
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