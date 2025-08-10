import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- INTERFACES ---

// Representa los campos del struct ExperienceNFT anidado dentro de un Listing
interface ExperienceNftFields {
  id: { id: string }; // El tipo UID de Move se deserializa a { id: "0x..." }
  name: string;
  description: string;
  image_url: { fields: { url: string } }; // El tipo Url de Move se deserializa a { fields: { url: "..." } }
  provider_address: string;
}

// Representa los campos del struct Listing
interface ListingFields {
  id: { id: string };
  nft: ExperienceNftFields;
  price: string;
  is_available: boolean;
  is_tkt_listing: boolean;
  seller: string;
  provider_id: string;
}

// La estructura de datos limpia que el hook devuelve a la UI
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

// 1. CORRECCIÓN: Apuntar a la URL de GraphQL de Testnet
const SUI_TESTNET_GRAPHQL_URL = 'https://sui-testnet.mystenlabs.com/graphql';

export function useGetListings() {
  const suiClient = useSuiClient();

  return useQuery({
    // La query key ahora incluye el packageId para que se refresque si cambia
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
        const response = await fetch(SUI_TESTNET_GRAPHQL_URL, { // Usamos la URL correcta
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: GQL_QUERY,
            variables: {
              // 2. CORRECCIÓN: Usa el packageId más reciente desde suiConfig
              listingType: `${suiConfig.packageId}::experience_nft::Listing`,
            },
          }),
        });
        
        const result = await response.json();
        
        if (result.errors) { throw new Error(`Error en GraphQL: ${JSON.stringify(result.errors)}`); }
        
        const listingsData = result.data.objects.nodes;

        const listingsWithDetails: NftListing[] = listingsData
          .map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as ListingFields;
            // Filtramos los que no están disponibles
            if (!fields || !fields.is_available) { return null; }

            // 3. CORRECCIÓN: Extraemos los datos de la estructura anidada correcta
            return {
              listingId: node.objectId,
              price: Number(fields.price) / (10 ** 9),
              currency: fields.is_tkt_listing ? 'TKT' : 'SUI',
              isTktListing: fields.is_tkt_listing,
              seller: fields.seller,
              providerId: fields.provider_id,
              nft: {
                id: fields.nft.id.id, // Se accede a `id.id`
                name: fields.nft.name,
                description: fields.nft.description,
                imageUrl: fields.nft.image_url.fields.url, // Se accede a `image_url.fields.url`
                provider_address: fields.nft.provider_address,
              },
            };
          })
          .filter((listing: NftListing | null): listing is NftListing => listing !== null);

        console.log('✅ Listings procesados:', listingsWithDetails);
        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ Falló la obtención de datos con GraphQL:", error);
        throw error;
      }
    },
  });
}
