import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit'; // Necesitamos el cliente para consultar objetos
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

export function useGetListings() {
  // 1. Obtenemos el cliente de Sui del contexto
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['get-all-listings-definitive', suiConfig.packageId],
    queryFn: async (): Promise<NftListing[]> => {
      // A. Consulta GraphQL inicial (Obtiene los Listings)
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

      // B. Recolectar todos los IDs de los objetos Blob para consultarlos en lote
      const blobObjectIds = rawNodes
        .map((node: any) => node.asMoveObject?.contents?.json?.nft?.image_blob_object_id)
        .filter((id: string | undefined) => !!id);

      // C. Consultar a Sui para traducir "Sui Object ID" -> "Walrus Blob ID"
      // Esto es lo que soluciona el error SSL/Network del agregador
      const blobIdMap = new Map<string, string>();
      
      if (blobObjectIds.length > 0) {
        // Usamos multiGetObjects para eficiencia
        const blobObjectsResponse = await suiClient.multiGetObjects({
          ids: blobObjectIds,
          options: { showContent: true }
        });

        blobObjectsResponse.forEach((obj: SuiObjectResponse) => {
          if (obj.data?.objectId && obj.data.content?.dataType === 'moveObject') {
            // Buscamos el campo 'blob_id' dentro del objeto Blob de Sui
            // La estructura usual es { fields: { blob_id: "..." } }
            const fields = obj.data.content.fields as any;
            if (fields.blob_id) {
              blobIdMap.set(obj.data.objectId, fields.blob_id);
            }
          }
        });
      }

      // D. Construir la lista final usando los Blob IDs reales
      const listingsWithDetails: NftListing[] = rawNodes
        .map((node: any) => {
          const fields = node.asMoveObject?.contents?.json as ListingFields;
          if (!fields || !fields.is_available || !fields.nft) return null;

          const imageObjectId = fields.nft.image_blob_object_id;
          const realBlobId = blobIdMap.get(imageObjectId);
          
          // AHORA SI: Usamos el endpoint directo /v1/blobs/ que es robusto
          const finalImageUrl = realBlobId 
            ? `${WALRUS_AGGREGATOR_URL}/v1/blobs/${realBlobId}`
            : '/placeholder.png'; // Fallback si no pudimos resolver el ID

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