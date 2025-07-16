// src/app/layout.tsx

// Este es el layout más básico posible para satisfacer a Next.js.
// No necesita tener estilos ni componentes complejos.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
