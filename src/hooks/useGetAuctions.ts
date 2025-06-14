// src/hooks/useGetAuctions.ts
import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// La interfaz del objeto "limpio" que nuestro hook le entregará a la UI.
export interface AuctionListing {
    auctionId: string;
    nft: {
        name: string;
        imageUrl: string;
    };
    highestBid: number;
    endTime: number; // en milisegundos
}

// La interfaz de lo que esperamos del objeto `Auction` del contrato.
interface AuctionFields {
    id: { id: string };
    nft: { fields: { name: string; image_url: { url: string } } };
    highest_bid: string;
    end_timestamp_ms: string;
    is_settled: boolean;
}

const SUI_DEVNET_GRAPHQL_URL = 'https://sui-devnet.mystenlabs.com/graphql';

export function useGetAuctions() {
  return useQuery({
    queryKey: ['get-all-auctions-graphql'],
    queryFn: async (): Promise<AuctionListing[]> => {
      const GQL_QUERY = `
        query getAuctions($auctionType: String!) {
          objects(filter: { type: $auctionType }) {
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
              auctionType: `${suiConfig.packageId}::experience_nft::Auction`,
            },
          }),
        });
        
        const result = await response.json();
        if (result.errors) { throw new Error(`Error en GraphQL: ${JSON.stringify(result.errors)}`); }
        
        const auctionData = result.data.objects.nodes;

        return auctionData
          .map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as AuctionFields;
            // Filtramos las subastas que ya han sido liquidadas
            if (!fields || fields.is_settled) { return null; }

            return {
              auctionId: node.objectId,
              highestBid: Number(fields.highest_bid) / (10 ** 9),
              endTime: Number(fields.end_timestamp_ms),
              nft: {
                name: fields.nft.fields.name,
                imageUrl: fields.nft.fields.image_url.url,
              },
            };
          })
          .filter((auction: AuctionListing | null): auction is AuctionListing => auction !== null);
      } catch (error) {
        console.error("❌ Falló la obtención de subastas:", error);
        return [];
      }
    },
  });
}