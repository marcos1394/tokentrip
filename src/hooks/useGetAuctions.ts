import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// --- INTERFAZ PARA LA UI MEJORADA ---
// Ahora incluye toda la información útil que la UI podría necesitar.
export interface AuctionListing {
    auctionId: string;
    nft: {
        name: string;
        imageUrl: string;
    };
    highestBid: number;
    startTime: number;
    endTime: number;
    isTktAuction: boolean; // Para saber en qué moneda es la puja
    seller: string;
}

// --- INTERFAZ QUE REFLEJA 1:1 EL STRUCT DEL CONTRATO ---
interface AuctionFields {
    id: { id: string };
    nft: {
        type: string;
        fields: {
            some?: {
                fields: {
                    name: string;
                    image_url: { fields: { url: string } };
                }
            }
        }
    };
    seller: string;
    is_tkt_auction: boolean;
    reserve_price: string;
    start_price: string;
    highest_bid: string;
    highest_bidder: { fields: { some?: [string] } };
    start_timestamp_ms: string;
    end_timestamp_ms: string;
    is_settled: boolean;
}

const SUI_TESTNET_GRAPHQL_URL = 'https://sui-testnet.mystenlabs.com/graphql';

export function useGetAuctions() {
  return useQuery({
    queryKey: ['get-all-auctions-graphql'],
    queryFn: async (): Promise<AuctionListing[]> => {
      const GQL_QUERY = `
        query getAuctions($auctionType: String!) {
          objects(filter: { type: $auctionType }, first: 50, orderBy: { field: VERSION, direction: DESC }) {
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
              auctionType: `${suiConfig.auctionsPackageId}::auctions::Auction`,
            },
          }),
        });
        
        const result = await response.json();
        if (result.errors) { throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`); }
        
        const auctionData = result.data.objects.nodes;

        // --- LÓGICA DE TRANSFORMACIÓN ACTUALIZADA ---
        return auctionData
          .map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as AuctionFields;
            
            if (!fields || fields.is_settled || !fields.nft.fields.some) {
              return null;
            }

            const nftData = fields.nft.fields.some.fields;
            const currencyDivisor = 1e9; // 9 decimales para SUI y TKT

            return {
              auctionId: node.objectId,
              highestBid: Number(fields.highest_bid) / currencyDivisor,
              startTime: Number(fields.start_timestamp_ms),
              endTime: Number(fields.end_timestamp_ms),
              isTktAuction: fields.is_tkt_auction,
              seller: fields.seller,
              nft: {
                name: nftData.name,
                imageUrl: nftData.image_url.fields.url,
              },
            };
          })
          .filter((auction: AuctionListing | null): auction is AuctionListing => auction !== null);
      } catch (error) {
        console.error("❌ Failed to fetch auctions:", error);
        return [];
      }
    },
    refetchInterval: 15000, // Refresca cada 15 segundos para obtener pujas actualizadas
  });
}