import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui'; 

// --- INTERFACES ACTUALIZADAS ---

// La interfaz de lo que esperamos del `nft` anidado.
interface ExperienceNftFields {
  id: string; 
  name: string;
  description: string;
  image_url: { url: string };
  provider_address: string; // La dirección del creador original
}

// La interfaz de lo que esperamos del objeto `Listing` completo.
interface ListingFields {
  id: { id: string };
  nft: ExperienceNftFields;
  price: string;
  is_available: boolean;
  is_tkt_listing: boolean;
  seller: string; // La dirección del vendedor actual
  provider_id: string; // El ID del perfil del creador original
}

// La interfaz del objeto "limpio" que nuestro hook le entregará a la UI.
export interface NftListing {
  listingId: string;
  price: number;
  currency: 'SUI' | 'TKT';
  isTktListing: boolean;
  seller: string; // Se añade el vendedor
  providerId: string; // Se añade el ID del perfil del proveedor
  nft: {
    id:string;
    name: string;
    description: string;
    imageUrl: string;
    provider_address: string;
  };
}

const SUI_DEVNET_GRAPHQL_URL = 'https://sui-devnet.mystenlabs.com/graphql';

export function useGetListings() {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['get-all-listings-graphql-v5-secondary-market'],
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
        const response = await fetch(SUI_DEVNET_GRAPHQL_URL, {
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
        
        if (result.errors) { throw new Error(`Error en GraphQL: ${JSON.stringify(result.errors)}`); }
        
        const listingsData = result.data.objects.nodes;

        const listingsWithDetails: NftListing[] = listingsData
          .map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as ListingFields;
            if (!fields || !fields.is_available) { return null; }

            return {
              listingId: node.objectId,
              price: Number(fields.price) / (10 ** 9),
              currency: fields.is_tkt_listing ? 'TKT' : 'SUI',
              isTktListing: fields.is_tkt_listing,
              // --- NUEVO: Se añaden los datos del vendedor y proveedor ---
              seller: fields.seller,
              providerId: fields.provider_id,
              nft: {
                id: fields.nft.id,
                name: fields.nft.name,
                description: fields.nft.description,
                imageUrl: fields.nft.image_url.url,
                provider_address: fields.nft.provider_address,
              },
            };
          })
          .filter((listing: NftListing | null): listing is NftListing => listing !== null);

        console.log('✅ Listings procesados (con datos de vendedor):', listingsWithDetails);
        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ Falló la obtención de datos con GraphQL:", error);
        throw error;
      }
    },
  });
}