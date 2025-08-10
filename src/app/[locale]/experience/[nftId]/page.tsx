import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { ExperienceDetailClient } from '@/components/experience-detail-client';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';
import { suiConfig } from '@/config/sui';

// Interfaces para mayor claridad
interface SuiUrl {
  fields?: { url: string };
  url?: string;
}
interface NftFields {
  id: { id: string };
  name: string;
  description: string;
  image_url: SuiUrl; // Puede tener una de dos estructuras
  provider_address: string;
  provider_id: string;
  evolution_rules: any[];
}
interface ListingFields {
  price: string;
  is_available: boolean;
  is_tkt_listing: boolean;
  seller: string;
  provider_id: string;
  nft: { fields: NftFields };
}

/**
 * Función del lado del servidor, ahora más robusta.
 */
async function getExperienceData(id: string) {
  try {
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    const objectResponse = await suiClient.getObject({
      id: id,
      options: { showContent: true, showDisplay: true },
    });

    if (objectResponse.error || !objectResponse.data) {
      console.error("Error fetching object or object not found:", objectResponse.error);
      return null;
    }

    const object = objectResponse.data;
    const type = object.content?.dataType === 'moveObject' ? object.content.type : '';
    const fields = object.content?.dataType === 'moveObject' ? object.content.fields as any : null;

    if (!type || !fields) return null;

    let nftData: NftFields, listingData: ListingFields | null, providerProfile;

    if (type.includes('::experience_nft::Listing')) {
      listingData = fields;
      nftData = listingData.nft.fields;
    } else if (type.includes('::experience_nft::ExperienceNFT')) {
      nftData = fields;
      listingData = null;
    } else {
      console.warn("Object type not supported:", type);
      return null;
    }

    // --- NORMALIZACIÓN DE DATOS ---
    // Unificamos los datos en una sola estructura predecible para el cliente.
    
    // Función helper para extraer la URL de forma segura
    const getImageUrl = (imgObject: SuiUrl) => {
        return imgObject?.fields?.url || imgObject?.url || '';
    }
    
    const normalizedNft = {
        id: nftData.id.id,
        name: object.display?.data?.name || nftData.name,
        description: object.display?.data?.description || nftData.description,
        imageUrl: getImageUrl(nftData.image_url), // Usamos la función segura
        provider_address: nftData.provider_address,
        provider_id: nftData.provider_id,
        evolution_rules: nftData.evolution_rules
    };

    const providerObject = await suiClient.getObject({
      id: nftData.provider_id,
      options: { showContent: true },
    });
    providerProfile = providerObject.data?.content?.dataType === 'moveObject' ? providerObject.data.content.fields : null;

    // Devolvemos una estructura limpia y predecible
    return { nft: normalizedNft, listing: listingData, providerProfile };

  } catch (error) {
    console.error("Failed to fetch experience data:", error);
    return null;
  }
}

// --- El componente de página (Server Component) ---
export default async function ExperiencePage({ params }: { params: { nftId: string } }) {
  const data = await getExperienceData(params.nftId);

  if (!data) {
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

  // Pasa los datos normalizados al componente cliente
  return (
    <ExperienceDetailClient 
      nft={data.nft} 
      listing={data.listing} 
      providerProfile={data.providerProfile} 
      objectId={params.nftId} 
    />
  );
}
