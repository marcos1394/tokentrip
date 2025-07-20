// src/hooks/useGetLoanRequests.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// La interfaz "limpia" que usará nuestra UI
export interface LoanRequest {
    requestId: string;
    borrower: string;
    principal: number;
    repayment: number;
    durationDays: number;
    currency: 'SUI' | 'TKT';
    nft: {
        id: string;
        name: string;
        imageUrl: string;
    }
}

// La interfaz que coincide con la data cruda del indexer
interface RawLoanRequestFields {
    id: { id: string };
    borrower: string;
    principal_amount: string;
    repayment_amount: string;
    duration_ms: string;
    is_tkt_loan: boolean;
    nft: { fields: { id: { id: string }, name: string, image_url: { fields: { url: string } } } };
    fraction: { fields: { some?: any } }; // Para diferenciar
}

const SUI_TESTNET_GRAPHQL_URL = 'https://sui-testnet.mystenlabs.com/graphql';

export function useGetLoanRequests() {
  return useQuery<LoanRequest[]>({
    queryKey: ['get-loan-requests-graphql'],
    queryFn: async (): Promise<LoanRequest[]> => {
      const GQL_QUERY = `
        query getLoanRequests($requestType: String!) {
          objects(filter: { type: $requestType }, first: 50) {
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
              requestType: `${suiConfig.lendingPackageId}::lending_market::LoanRequest`,
            },
          }),
        });
        const result = await response.json();
        if (result.errors) { throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`); }
        
        const rawObjects = result.data.objects.nodes;
        
        return rawObjects
          .map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as RawLoanRequestFields;
            if (!fields) return null;

            const asset = fields.nft?.fields || fields.fraction?.fields?.some?.fields;
            if (!asset) return null;

            return {
              requestId: node.objectId,
              borrower: fields.borrower,
              principal: Number(fields.principal_amount) / 1e9,
              repayment: Number(fields.repayment_amount) / 1e9,
              durationDays: Math.round(Number(fields.duration_ms) / (1000 * 60 * 60 * 24)),
              currency: fields.is_tkt_loan ? 'TKT' : 'SUI',
              nft: {
                id: asset.id.id,
                name: asset.name || asset.parent_name,
                imageUrl: asset.image_url?.fields?.url || asset.parent_image_url?.fields?.url,
              },
            };
          })
          .filter((req: LoanRequest | null): req is LoanRequest => req !== null);
      } catch (error) {
        console.error("❌ Failed to fetch loan requests:", error);
        return [];
      }
    },
    refetchInterval: 60000, // Refresca cada minuto
  });
}
