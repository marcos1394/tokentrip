import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { FractionalizeClient } from '@/components/fractionalize-client';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

// Interfaz para la data normalizada del NFT
interface NftData {
  id: string;
  name: string;
  imageUrl: string;
}

// Función del lado del servidor para obtener los datos del NFT
async function getNftData(nftId: string): Promise<NftData | null> {
  try {
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

    const objectResponse = await suiClient.getObject({
      id: nftId,
      options: { showDisplay: true, showContent: true }, // Pedimos display y content como fallback
    });

    if (objectResponse.error || !objectResponse.data) {
      console.error("Error fetching NFT:", objectResponse.error);
      return null;
    }
    
    // Usamos el Display como fuente principal de verdad
    const display = objectResponse.data.display?.data;
    const fields = objectResponse.data.content?.dataType === 'moveObject' ? objectResponse.data.content.fields as any : {};

    return {
      id: objectResponse.data.objectId,
      name: display?.name || fields.name || 'NFT sin nombre',
      imageUrl: display?.image_url || fields.image_url?.url || '',
    };

  } catch (error) {
    console.error("Failed to fetch NFT data:", error);
    return null;
  }
}


// Componente de página (Server Component)
export default async function FractionalizePage({ params }: { params: { nftId: string } }) {
  const nftData = await getNftData(params.nftId);

  if (!nftData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
         <Card className="glass-card p-8"><AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
             <h1 className="text-2xl font-bold text-foreground">NFT Not Found</h1>
             <p className="mt-2 text-muted-foreground">Could not load the data for this digital asset.</p>
             <Button asChild className="mt-6 btn-sui-outline"><Link href="/">Back</Link></Button>
         </Card>
     </div>
    );
  }

  // Pasa los datos del NFT al componente cliente
  return <FractionalizeClient nft={nftData} />;
}