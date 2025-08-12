import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- Interfaces (sin cambios) ---
interface Uid {
  id: string;
}
interface SuiUrl {
  fields: {
    url: string;
  };
}
interface ExperienceNftFields {
  id: Uid;
  name: string;
  description: string;
  image_url: SuiUrl;
  provider_address: string;
}
interface ListingFields {
  id: Uid;
  nft: { fields: ExperienceNftFields };
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
        // --- LOG 1: VER LA RESPUESTA CRUDA DE LA API ---
        console.log('[useGetListings] Raw result from GraphQL:', result);

        if (result.errors) { throw new Error(`Error en GraphQL: ${JSON.stringify(result.errors)}`); }
        
        const listingsData = result.data.objects.nodes;
        // --- LOG 2: VER LOS OBJETOS EXTRAÍDOS ---
        console.log('[useGetListings] Extracted nodes:', listingsData);

        const listingsBeforeFilter = listingsData.map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as ListingFields;
            if (!fields || !fields.is_available || !fields.nft?.fields) { 
                console.warn('[useGetListings] Omitiendo listing inválido o no disponible:', node);
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
                imageUrl: fields.nft.fields.image_url.fields.url,
                provider_address: fields.nft.fields.provider_address,
              },
            };
        });

        // --- LOG 3: VER LA LISTA ANTES DE FILTRAR LOS NULOS ---
        console.log('[useGetListings] Listings before filtering:', listingsBeforeFilter);

        const listingsWithDetails = listingsBeforeFilter
          .filter((listing: NftListing | null): listing is NftListing => listing !== null);

        // --- LOG 4: VER EL RESULTADO FINAL ---
        console.log('✅ [useGetListings] Listings procesados finales:', listingsWithDetails);
        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ [useGetListings] Falló la obtención de datos:", error);
        throw error;
      }
    },
  });
}