// src/app/[locale]/lending/page.tsx
'use client';

import { useGetLoanRequests } from "@/hooks/useGetLoanRequests";
import { Loader2, ServerCrash } from "lucide-react";
// En el futuro, crearemos un componente <LoanRequestCard />
// import { LoanRequestCard } from "@/components/LoanRequestCard"; 

export default function LendingPage() {
    const { data: requests, isLoading, isError } = useGetLoanRequests();

    return (
        <div className="container mx-auto py-24">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance heading-gradient">
                    P2P Lending Marketplace
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance mt-4">
                    Earn yield by lending SUI or TKT, or borrow against your Experience NFTs.
                </p>
            </div>

            {isLoading && <div className="flex justify-center py-24"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}
            {isError && <div className="text-center py-24 text-destructive">Failed to load loan requests.</div>}

            {!isLoading && requests && (
                requests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Aquí mapearíamos los `requests` y renderizaríamos un <LoanRequestCard /> para cada uno */}
                        {requests.map(req => (
                           <div key={req.requestId} className="p-4 border rounded-lg glass-card">
                               <img src={req.nft.imageUrl} alt={req.nft.name} className="w-full h-40 object-cover rounded-md mb-2"/>
                               <h3 className="font-bold truncate">{req.nft.name}</h3>
                               <p>Borrow {req.principal} {req.currency}</p>
                               <p>Repay {req.repayment} {req.currency} in {req.durationDays} days</p>
                           </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 text-muted-foreground">No loan requests available at the moment.</div>
                )
            )}
        </div>
    );
}
