import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- INTERFACES ALINEADAS CON EL NUEVO CONTRATO ---

// El struct NFT anidado ahora contiene el ID del blob
interface NftFromListing {
  id: { id: string };
  image_blob_object_id: string; // <-- CAMBIO CLAVE
  name: string;
  description: string;
  image_url: { fields: { url: string } };
  provider_address: string;
}

// El struct Listing contiene el NFT anidado
interface ListingFields {
  id: { id: string };
  nft: { fields: NftFromListing };
  price: string;
  is_available: boolean;
  is_tkt_listing: boolean;
  seller: string;
  provider_id: string;
}

// La estructura final para la UI
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
            if (!fields || !fields.is_available || !fields.nft?.fields) { 
                return null; 
            }

            // --- LÓGICA DE URL FINAL Y CORRECTA ---
            // Leemos el ID del blob que guardamos en el NFT
            const imageBlobObjectId = fields.nft.fields.image_blob_object_id;
            
            // Construimos la URL que sí funciona para renderizar
            const finalImageUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-object-id/${imageBlobObjectId}`;

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
                imageUrl: finalImageUrl,
                provider_address: fields.nft.fields.provider_address,
              },
            };
          })
          .filter((listing: NftListing | null): listing is NftListing => listing !== null);

        console.log('✅ Listings procesados con la nueva estructura:', listingsWithDetails);
        return listingsWithDetails;
        
      } catch (error) {
        console.error("❌ Falló la obtención de datos con GraphQL:", error);
        throw error;
      }
    },
  });
}