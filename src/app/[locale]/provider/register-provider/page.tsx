// Archivo: src/app/[locale]/provider/register-provider/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react'; // O tu componente de carga preferido

// Importamos nuestro componente de forma dinámica, desactivando el renderizado en servidor (SSR).
const RegisterProviderClient = dynamic(
  () => import('@/components/provider/RegisterProviderClient'),
  { 
    ssr: false,
    // Opcional: Muestra un spinner de carga mientras el componente se carga en el cliente.
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    ),
  }
);

export default function RegisterProviderPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10" />
        </div>
    }>
        <RegisterProviderClient />
    </Suspense>
  );
}
