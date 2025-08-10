import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- INTERFACES CORREGIDAS PARA COINCIDIR CON LA ESTRUCTURA REAL ---
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
  nft: ExperienceNftFields;
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
        if (result.errors) { throw new Error(`Error en GraphQL: ${JSON.stringify(result.errors)}`); }
        
        const listingsData = result.data.objects.nodes;

        const listingsWithDetails: NftListing[] = listingsData
          .map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as ListingFields;
            if (!fields || !fields.is_available || !fields.nft) { return null; }

            // --- CORRECCIÓN FINAL Y DEFINITIVA AQUÍ ---
            // Aseguramos que la ruta al objeto 'url' sea la correcta
            return {
              listingId: node.objectId,
              price: Number(fields.price) / (10 ** 9),
              currency: fields.is_tkt_listing ? 'TKT' : 'SUI',
              isTktListing: fields.is_tkt_listing,
              seller: fields.seller,
              providerId: fields.provider_id,
              nft: {
                id: fields.nft.id.id,
                name: fields.nft.name,
                description: fields.nft.description,
                imageUrl: fields.nft.image_url?.fields?.url || '', // Acceso seguro a la URL
                provider_address: fields.nft.provider_address,
              },
            };
          })
          .filter((listing): listing is NftListing => listing !== null);

        console.log('✅ Listings procesados:', listingsWithDetails);
        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ Falló la obtención de datos con GraphQL:", error);
        throw error;
      }
    },
  });
}
