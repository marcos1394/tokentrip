'use client';

import { useQuery } from '@tanstack/react-query';
import { suiConfig } from '@/config/sui';

// La interfaz "limpia" que usará nuestra UI
export interface ActiveLoan {
    loanId: string;
    borrower: string;
    lender: string;
    repayment: number;
    dueDate: number; // en milisegundos
    currency: 'SUI' | 'TKT';
    nft: {
        id: string;
        name: string;
        imageUrl: string;
    }
}

// La interfaz que coincide con la data cruda del indexer
interface RawActiveLoanFields {
    id: { id: string };
    borrower: string;
    lender: string;
    repayment_amount: string;
    due_timestamp_ms: string;
    is_tkt_loan: boolean;
    nft: { fields: { some?: { fields: { id: { id: string }, name: string, image_url: { fields: { url: string } } } } } };
    fraction: { fields: { some?: { fields: { id: { id: string }, parent_name: string, parent_image_url: { fields: { url: string } } } } } };
}

const SUI_TESTNET_GRAPHQL_URL = 'https://sui-testnet.mystenlabs.com/graphql';

export function useGetActiveLoans() {
  return useQuery<ActiveLoan[]>({
    queryKey: ['get-active-loans-graphql'],
    queryFn: async (): Promise<ActiveLoan[]> => {
      const GQL_QUERY = `
        query getActiveLoans($loanType: String!) {
          objects(filter: { type: $loanType }, first: 50) {
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
              loanType: `${suiConfig.lendingPackageId}::lending_market::ActiveLoan`,
            },
          }),
        });
        const result = await response.json();
        if (result.errors) { throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`); }
        
        const rawObjects = result.data.objects.nodes;
        
        return rawObjects
          .map((node: any) => {
            const fields = node.asMoveObject?.contents?.json as RawActiveLoanFields;
            if (!fields) return null;

            const asset = fields.nft?.fields.some?.fields || fields.fraction?.fields.some?.fields;
            if (!asset) return null;

            return {
              loanId: node.objectId,
              borrower: fields.borrower,
              lender: fields.lender,
              repayment: Number(fields.repayment_amount) / 1e9,
              dueDate: Number(fields.due_timestamp_ms),
              currency: fields.is_tkt_loan ? 'TKT' : 'SUI',
              nft: {
                id: asset.id.id,
                name: asset.name || asset.parent_name,
                imageUrl: asset.image_url?.fields?.url || asset.parent_image_url?.fields?.url,
              },
            };
          })
          .filter((loan: ActiveLoan | null): loan is ActiveLoan => loan !== null);
      } catch (error) {
        console.error("❌ Failed to fetch active loans:", error);
        return [];
      }
    },
    refetchInterval: 60000,
  });
}
