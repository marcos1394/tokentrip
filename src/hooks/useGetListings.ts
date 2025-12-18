import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { suiConfig } from '@/config/sui';
import { SuiObjectResponse } from '@mysten/sui/client';

// --- INTERFACES ---
interface Attribute {
  key: string;
  value: string;
}
interface NftFromListing {
  id: string; 
  image_blob_object_id: string;
  name: string;
  description: string;
  attributes: Attribute[];
  provider_address: string;
}
interface ListingFields {
  id: string; 
  nft: NftFromListing; 
  price: string;
  is_available: boolean;
  is_tkt_listing: boolean;
  seller: string;
  provider_id: string;
}

export interface NftListing {
  listingId: string;
  price: number;
  currency: 'SUI' | 'TKT';
  isTktListing: boolean;
  seller: string;
  providerId: string;
  nft: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    contentType: string;
    provider_address: string;
  };
}

const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

// --- FUNCIÓN AUXILIAR CRÍTICA: Convierte u256 Decimal a Base64URL ---
// Esto soluciona el error SSL/Connection Closed al transformar el ID numérico
// al formato que Walrus espera (ej: "M4hsZG...").
function u256ToBlobId(u256Str: string): string {
  try {
    // 1. Convertir string decimal a BigInt
    const bigInt = BigInt(u256Str);
    // 2. Convertir a Hexadecimal
    let hex = bigInt.toString(16);
    // Asegurar que tenga longitud par para poder parsear bytes
    if (hex.length % 2 !== 0) hex = '0' + hex;
    
    // 3. Convertir Hex a Array de Bytes
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    // 4. Convertir Bytes a Base64 estándar
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    const base64 = btoa(binary);
    
    // 5. Convertir Base64 a Base64URL (Reemplazos estándar de URL-safe)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error("Error convirtiendo Blob ID:", e);
    return "";
  }
}

export function useGetListings() {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['get-all-listings-definitive', suiConfig.packageId],
    queryFn: async (): Promise<NftListing[]> => {
      // A. Consulta GraphQL
      const GQL_QUERY = `
        query getListings($listingType: String!) {
          objects(filter: { type: $listingType }) {
            nodes {
              objectId: address
              asMoveObject { contents { json } }
            }
          }
        }`;

      const response = await fetch(suiConfig.graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GQL_QUERY,
          variables: { listingType: `${suiConfig.packageId}::experience_nft::Listing` },
        }),
      });
      
      const result = await response.json();
      if (result.errors) { throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`); }
      
      const rawNodes = result.data.objects.nodes;

      // B. Recolectar IDs
      const blobObjectIds = rawNodes
        .map((node: any) => node.asMoveObject?.contents?.json?.nft?.image_blob_object_id)
        .filter((id: string | undefined) => !!id);

      // C. Consultar a Sui para obtener el Blob ID numérico
      const blobIdMap = new Map<string, string>();
      
      if (blobObjectIds.length > 0) {
        const blobObjectsResponse = await suiClient.multiGetObjects({
          ids: blobObjectIds,
          options: { showContent: true }
        });

        blobObjectsResponse.forEach((obj: SuiObjectResponse) => {
          if (obj.data?.objectId && obj.data.content?.dataType === 'moveObject') {
            const fields = obj.data.content.fields as any;
            if (fields.blob_id) {
              blobIdMap.set(obj.data.objectId, fields.blob_id);
            }
          }
        });
      }

      // D. Construir lista final
      const listingsWithDetails: NftListing[] = rawNodes
        .map((node: any) => {
          const fields = node.asMoveObject?.contents?.json as ListingFields;
          if (!fields || !fields.is_available || !fields.nft) return null;

          const imageObjectId = fields.nft.image_blob_object_id;
          const rawBlobId = blobIdMap.get(imageObjectId); // Esto devuelve el número "10156..."
          
          let finalImageUrl = '/placeholder.png';

          if (rawBlobId) {
            // AQUI USAMOS LA NUEVA FUNCIÓN DE CONVERSIÓN
            const correctBlobId = u256ToBlobId(rawBlobId);
            if (correctBlobId) {
                finalImageUrl = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${correctBlobId}`;
            }
          }

          const contentTypeAttr = Array.isArray(fields.nft.attributes) 
            ? fields.nft.attributes.find(attr => attr?.key === 'content-type') 
            : undefined;
          
          const contentType = contentTypeAttr ? contentTypeAttr.value : 'image/png';

          return {
            listingId: node.objectId,
            price: Number(fields.price) / (10 ** 9),
            currency: fields.is_tkt_listing ? 'TKT' : 'SUI',
            isTktListing: fields.is_tkt_listing,
            seller: fields.seller,
            providerId: fields.provider_id,
            nft: {
              id: fields.nft.id,
              name: fields.nft.name,
              description: fields.nft.description,
              imageUrl: finalImageUrl,
              contentType: contentType,
              provider_address: fields.nft.provider_address,
            },
          };
        })
        .filter((l: NftListing | null): l is NftListing => l !== null);

      return listingsWithDetails;
    },
  });
}