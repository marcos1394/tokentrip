"use client"

// Componentes de la página
import { AnimatedBackground } from "@/components/animated-background";
// Por ahora, solo importamos el background. El resto de las secciones las crearemos después.
// import { HeroSection } from "@/components/landing/HeroSection";
// ... etc

export default function HomePage() {
  return (
    <div>
      <AnimatedBackground />
      
      {/* Placeholder mientras reconstruimos los componentes de sección */}
      <div className="container mx-auto text-center py-48">
        <h1 className="text-5xl font-bold heading-gradient">Reconstruyendo TokenTrip...</h1>
        <p className="text-muted-foreground mt-4">Los componentes de la página principal se añadirán aquí en el siguiente paso.</p>
      </div>
      
    </div>
  )
}
