import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- INTERFACES CORREGIDAS PARA COINCIDIR CON LA ESTRUCTURA REAL ---
interface NftFields {
  id: { id: string };
  name: string;
  description: string;
  image_url: string; 
  provider_address: string;
}

// CORRECCIÓN CLAVE: El NFT está anidado dentro de un objeto `fields`
interface ListingFields {
  id: { id: string };
  nft: { 
    type: string;
    fields: NftFields; 
  };
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
    queryKey: ['get-all-listings', suiConfig.packageId],
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
        console.log('[useGetListings] 1. Resultado CRUDO de GraphQL:', result);

        if (result.errors) { throw new Error(`Error en GraphQL: ${JSON.stringify(result.errors)}`); }
        
        const listingsData = result.data.objects.nodes;
        console.log(`[useGetListings] 2. Nodos extraídos: (${listingsData.length})`, listingsData);

        const listingsBeforeFilter = listingsData.map((node: any, index: number) => {
            const fields = node.asMoveObject?.contents?.json as ListingFields;
            console.log(`[useGetListings] 3. Procesando Nodo #${index}:`, { fields });

            if (!fields || !fields.is_available || !fields.nft?.fields) { 
                console.warn(`[useGetListings] 4. ¡OMITIENDO Nodo #${index} por estructura inválida o no estar disponible!`);
                return null; 
            }

            return {
              listingId: node.objectId,
              price: Number(fields.price) / (10 ** 9),
              currency: fields.is_tkt_listing ? 'TKT' : 'SUI',
              isTktListing: fields.is_tkt_listing,
              seller: fields.seller,
              providerId: fields.provider_id,
              nft: {
                id: fields.nft.fields.id.id,
                name: fields.nft.fields.name,
                description: fields.nft.fields.description,
                imageUrl: fields.nft.fields.image_url,
                provider_address: fields.nft.fields.provider_address,
              },
            };
        });

        console.log('[useGetListings] 4. Listings antes de filtrar:', listingsBeforeFilter);

        const listingsWithDetails = listingsBeforeFilter
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