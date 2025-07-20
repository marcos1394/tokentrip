// src/hooks/useGetRentalListings.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// La interfaz "limpia" que el hook entrega a la UI
export interface RentalListing {
    listingId: string;
    owner: string;
    price: string;
    isTktListing: boolean;
    startTime: string;
    endTime: string;
    isRented: boolean;
    asset: {
        id: string;
        name: string;
        imageUrl: string;
        isFraction: boolean;
    }
}

// La interfaz que coincide con la data cruda del indexer de Sui
interface RawRentalListingFields {
    id: { id: string };
    owner: string;
    price: string;
    is_tkt_listing: boolean;
    start_timestamp_ms: string;
    end_timestamp_ms: string;
    is_rented: boolean;
    fraction: {
        type: string;
        fields: {
            some?: {
                fields: {
                    id: { id: string };
                    parent_name: string;
                    parent_image_url: { fields: { url: string } };
                }
            }
        }
    };
    experience_nft: {
        type: string;
        fields: {
            some?: {
                fields: {
                    id: { id: string };
                    name: string;
                    image_url: { fields: { url: string } };
                }
            }
        }
    };
}

const SUI_TESTNET_GRAPHQL_URL = 'https://sui-testnet.mystenlabs.com/graphql';

export function useGetRentalListings() {
  return useQuery<RentalListing[]>({
    queryKey: ['get-rental-listings-graphql'],
    queryFn: async (): Promise<RentalListing[]> => {
      const GQL_QUERY = `
        query getRentalListings($listingType: String!) {
          objects(
            filter: { type: $listingType }
            first: 50
            orderBy: { field: VERSION, direction: DESC }
          ) {
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
              listingType: `${suiConfig.rentalPackageId}::rental_market::RentalListing`,
            },
          }),
        });
        
        const result = await response.json();
        if (result.errors) { throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`); }
        
        const listingsData = result.data.objects.nodes;

        return listingsData
          .map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as RawRentalListingFields;
            
            if (!fields || fields.is_rented) return null;

            const isFraction = !!fields.fraction.fields.some;
            const assetData = isFraction 
                ? fields.fraction.fields.some!.fields 
                : fields.experience_nft.fields.some!.fields;
            const imageUrl = isFraction 
                ? assetData.parent_image_url.fields.url
                : assetData.image_url.fields.url;
            const name = isFraction ? assetData.parent_name : assetData.name;

            return {
              listingId: node.objectId,
              owner: fields.owner,
              price: fields.price,
              isTktListing: fields.is_tkt_listing,
              startTime: fields.start_timestamp_ms,
              endTime: fields.end_timestamp_ms,
              isRented: fields.is_rented,
              asset: {
                id: assetData.id.id,
                name: name,
                imageUrl: imageUrl,
                isFraction: isFraction,
              },
            };
          })
          .filter((listing: RentalListing | null): listing is RentalListing => listing !== null);
      } catch (error) {
        console.error("❌ Failed to fetch rental listings:", error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresca cada 30 segundos
  });
}
