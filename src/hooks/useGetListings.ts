import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- INTERFACES CORREGIDAS Y COMPLETAS ---
interface NftFields {
  id: { id: string };
  image_blob_object_id: string; // El ID del objeto Blob que guardamos en el contrato
  name: string;
  description: string;
  image_url: string; 
  provider_address: string;
}

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
    queryKey: ['get-all-listings-final', suiConfig.packageId],
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
            if (!fields || !fields.is_available || !fields.nft?.fields) { 
                return null; 
            }

            // --- LÓGICA DE URL RESTAURADA Y CORRECTA ---
            // 1. Leemos el ID del objeto Blob que guardamos en el NFT
            const imageBlobObjectId = fields.nft.fields.image_blob_object_id;
            
            // 2. Limpiamos el ID del objeto, quitando el prefijo "0x"
            const cleanBlobObjectId = imageBlobObjectId.startsWith('0x') 
                ? imageBlobObjectId.substring(2) 
                : imageBlobObjectId;
            
            // 3. Construimos la URL que funciona para renderizar, usando el ID del Blob
            const finalImageUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-object-id/${cleanBlobObjectId}`;

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
                imageUrl: finalImageUrl, // Pasamos la URL final y correcta
                provider_address: fields.nft.fields.provider_address,
              },
            };
          })
          .filter((listing: NftListing | null): listing is NftListing => listing !== null);

        console.log('✅ Listings procesados (con URL corregida):', listingsWithDetails);
        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ Falló la obtención de datos con GraphQL:", error);
        throw error;
      }
    },
  });
}