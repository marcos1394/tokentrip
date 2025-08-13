import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- INTERFACES BASADAS EN LA ESTRUCTURA QUE FUNCIONA ---
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
    queryKey: ['get-all-listings-final-debug', suiConfig.packageId],
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
            
            if (!fields || !fields.is_available || !fields.nft) { 
                console.warn(`[useGetListings] 4. ¡OMITIENDO Nodo #${index} por estructura inválida o no estar disponible!`);
                return null; 
            }

            const imageBlobObjectId = fields.nft.image_blob_object_id;
            const finalImageUrl = imageBlobObjectId 
              ? `${WALRUS_AGGREGATOR_URL}/v1/blobs/by-object-id/${imageBlobObjectId}`
              : '';
            
            // --- LOGS DETALLADOS PARA CONTENT-TYPE ---
            console.log(`[useGetListings] Atributos para Nodo #${index}:`, fields.nft.attributes);
            const contentTypeAttr = Array.isArray(fields.nft.attributes) 
              ? fields.nft.attributes.find(attr => {
                  console.log(`[useGetListings] Comprobando key: '${attr?.fields?.key}'`);
                  return attr?.fields?.key === 'content-type';
                }) 
              : undefined;
            
            const contentType = contentTypeAttr ? contentTypeAttr.fields.value : 'application/octet-stream';
            console.log(`[useGetListings] Content-Type encontrado para Nodo #${index}: ${contentType}`);

            const processedNft = {
              id: fields.nft.id,
              name: fields.nft.name,
              description: fields.nft.description,
              imageUrl: finalImageUrl,
              contentType: contentType,
              provider_address: fields.nft.provider_address,
            };
            
            console.log(`[useGetListings] -> Datos procesados para Nodo #${index}:`, processedNft);

            return {
              listingId: node.objectId,
              price: Number(fields.price) / (10 ** 9),
              currency: fields.is_tkt_listing ? 'TKT' : 'SUI',
              isTktListing: fields.is_tkt_listing,
              seller: fields.seller,
              providerId: fields.provider_id,
              nft: processedNft,
            };
          })
          .filter((listing: NftListing | null): listing is NftListing => listing !== null);

        console.log('✅ [useGetListings] 5. Listings finales procesados:', listingsWithDetails);
        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ Falló la obtención de datos:", error);
        throw error;
      }
    },
  });
}
