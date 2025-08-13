import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- INTERFACES CORREGIDAS PARA EL JSON REAL DE LA API ---

interface NftFromListing {
  id: string; 
  name: string;
  description: string;
  image_url: { url: string }; 
  provider_address: string;
  image_blob_object_id: string; 
}

interface ListingFields {
  id: { id: string }; 
  nft: NftFromListing; 
  price: string;
  is_available: boolean;
  is_tkt_listing: boolean;
  seller: string;
  provider_id: string;
}

// Estructura de datos final que usa la UI
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
    provider_address: string;
  };
}

const SUI_TESTNET_GRAPHQL_URL = 'https://sui-testnet.mystenlabs.com/graphql';

export function useGetListings() {
  return useQuery({
    queryKey: ['get-all-listings-final-v2', suiConfig.packageId],
    queryFn: async (): Promise<NftListing[]> => {
      const GQL_QUERY = `
        query getListings($listingType: String!) {
          objects(filter: { type: $listingType }) {
            nodes {
              objectId: address
              asMoveObject { contents { json } }
            }
          }
        }`;

      try {
        console.log(`[useGetListings] Buscando listings para el packageId: ${suiConfig.packageId}`);
        const response = await fetch(SUI_TESTNET_GRAPHQL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: GQL_QUERY,
            variables: {
              listingType: `${suiConfig.packageId}::experience_nft::Listing`,
            },
          }),
        });
        
        const result = await response.json();
        console.log('[useGetListings] 1. Resultado CRUDO de GraphQL:', JSON.parse(JSON.stringify(result)));

        if (result.errors) { throw new Error(`Error en GraphQL: ${JSON.stringify(result.errors)}`); }
        
        const listingsData = result.data.objects.nodes;
        console.log(`[useGetListings] 2. Nodos extraídos: (${listingsData.length})`, listingsData);

        const listingsWithDetails: NftListing[] = listingsData
          .map((node: any, index: number) => {
            const fields = node.asMoveObject?.contents?.json as ListingFields;
            console.log(`[useGetListings] 3. Procesando Nodo #${index}:`, { fields });
            
            // La condición ahora es más simple y correcta
            if (!fields || !fields.is_available || !fields.nft) { 
                console.warn(`[useGetListings] 4. ¡OMITIENDO Nodo #${index} por estructura inválida o no disponible!`);
                return null; 
            }

            const imageBlobObjectId = fields.nft.image_blob_object_id;
            const cleanBlobObjectId = imageBlobObjectId.startsWith('0x') ? imageBlobObjectId.substring(2) : imageBlobObjectId;
            const finalImageUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-object-id/${cleanBlobObjectId}`;

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
                provider_address: fields.nft.provider_address,
              },
            };
          })
          .filter((listing: NftListing | null): listing is NftListing => listing !== null);

        console.log('✅ [useGetListings] 5. Listings finales procesados:', listingsWithDetails);
        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ [useGetListings] Falló la obtención de datos:", error);
        throw error;
      }
    },
  });
}