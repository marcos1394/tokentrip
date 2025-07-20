// src/app/[locale]/lending/page.tsx
'use client';

import { useGetLoanRequests } from "@/hooks/useGetLoanRequest";
import { LoanRequestCard } from "@/components/LoanRequestCard"; 
import { Loader2, ServerCrash, PiggyBank } from "lucide-react";

export default function LendingPage() {
    const { data: requests, isLoading, isError } = useGetLoanRequests();

    return (
        <div className="container mx-auto py-24">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance heading-gradient">
                    P2P Lending Marketplace
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance mt-4">
                    Earn yield by lending SUI or TKT, or unlock liquidity by borrowing against your Experience NFTs.
                </p>
            </div>

            {isLoading && (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            )}
            
            {isError && (
                <div className="text-center py-24 text-destructive space-y-4">
                    <ServerCrash className="w-12 h-12 mx-auto" />
                    <h2 className="text-2xl font-bold">Failed to Load Loan Requests</h2>
                    <p>There was an error fetching data from the network. Please try again later.</p>
                </div>
            )}

            {!isLoading && requests && (
                requests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {requests.map(req => (
                           <LoanRequestCard key={req.requestId} request={req} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 text-muted-foreground space-y-4">
                        <PiggyBank className="w-12 h-12 mx-auto" />
                        <h2 className="text-2xl font-bold">No Loan Requests Available</h2>
                        <p>Be the first to create or fund a loan on TokenTrip!</p>
                    </div>
                )
            )}
        </div>
    );
}
