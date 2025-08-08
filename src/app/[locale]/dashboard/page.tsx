// Archivo: src/app/[locale]/dashboard/page.tsx
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Importamos nuestro nuevo componente de forma dinámica, desactivando el renderizado en servidor (SSR).
const DashboardClient = dynamic(
  () => import('@/components/dashboard/DashboardClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    ),
  }
);

export default function DashboardPage() {
  return <DashboardClient />;
}