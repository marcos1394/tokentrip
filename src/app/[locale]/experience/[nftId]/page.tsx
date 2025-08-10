import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { ExperienceDetailClient } from '@/components/experience-detail-client'; // Crearemos este componente a continuación
import { suiConfig } from '@/config/sui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

// Interfaces para tipar los datos extraídos
interface NftFields {
  id: { id: string };
  name: string;
  description: string;
  image_url: { fields: { url: string } };
  provider_address: string;
  provider_id: string;
  evolution_rules: any[]; // Simplificado por ahora
}
interface ListingFields {
  price: string;
  is_available: boolean;
  is_tkt_listing: boolean;
  seller: string;
  provider_id: string;
  nft: { fields: NftFields };
}

// --- Lógica de obtención de datos en el servidor ---
async function getExperienceData(listingId: string) {
  try {
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

    // 1. Obtener el objeto del listing
    const listingObject = await suiClient.getObject({
      id: listingId,
      options: { showContent: true },
    });

    if (listingObject.error || listingObject.data?.content?.dataType !== 'moveObject') {
      return null;
    }
    const listingFields = listingObject.data.content.fields as unknown as ListingFields;

    // 2. Obtener el perfil del proveedor
    const providerObject = await suiClient.getObject({
      id: listingFields.provider_id,
      options: { showContent: true },
    });
    const providerProfile = providerObject.data;
    
    return { listing: listingFields, providerProfile };

  } catch (error) {
    console.error("Failed to fetch experience data:", error);
    return null;
  }
}

// --- El componente de página ahora es un Componente de Servidor ---
export default async function ExperiencePage({ params }: { params: { nftId: string } }) {
  const data = await getExperienceData(params.nftId);

  // Si no se encuentran datos, muestra la página de "no encontrado" de Next.js
  if (!data) {
    // Puedes usar notFound() o un componente personalizado
    return (
        <div className="min-h-screen flex items-center justify-center text-center p-4">
           <Card className="glass-card p-8"><AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
               <h1 className="text-2xl font-bold text-foreground">Experience Not Found</h1>
               <p className="mt-2 text-muted-foreground">This item may have been sold or is no longer available.</p>
               <Button asChild className="mt-6 btn-sui-outline"><Link href="/">Back to Marketplace</Link></Button>
           </Card>
       </div>
    );
  }

  // Pasa los datos obtenidos en el servidor como props al componente cliente
  return <ExperienceDetailClient listing={data.listing} providerProfile={data.providerProfile} listingId={params.nftId} />;
}