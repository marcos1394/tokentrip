import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// Interfaces finales para el JSON real de la API
interface Attribute {
  fields: {
    key: string;
    value: string;
  }
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
    contentType: string;
    provider_address: string;
  };
}

const SUI_TESTNET_GRAPHQL_URL = 'https://sui-testnet.mystenlabs.com/graphql';
const WALRUS_AGGREGATOR_URL = 'https://aggregator.testnet.walrus.atalma.io';

export function useGetListings() {
  return useQuery({
    queryKey: ['get-all-listings-final-v5', suiConfig.packageId],
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
            if (!fields || !fields.is_available || !fields.nft) { 
                return null; 
            }

            const imageBlobObjectId = fields.nft.image_blob_object_id;
            const finalImageUrl = imageBlobObjectId 
              ? `${WALRUS_AGGREGATOR_URL}/v1/blobs/by-object-id/${imageBlobObjectId}`
              : '';
            
            // --- BÚSQUEDA SEGURA DEL CONTENT-TYPE ---
            const contentTypeAttr = Array.isArray(fields.nft.attributes) 
              ? fields.nft.attributes.find(attr => attr?.fields?.key === 'content-type') 
              : undefined;
            const contentType = contentTypeAttr ? contentTypeAttr.fields.value : 'application/octet-stream';

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
          .filter((listing: NftListing | null): listing is NftListing => listing !== null);

        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ Falló la obtención de datos:", error);
        throw error;
      }
    },
  });
}
