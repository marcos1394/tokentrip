// Archivo: src/app/[locale]/provider/mint/page.tsx
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MintExperienceClient = dynamic(
  () => import('@/components/provider/MintExperienceClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    ),
  }
);

export default function MintExperiencePage() {
  return <MintExperienceClient />;
}