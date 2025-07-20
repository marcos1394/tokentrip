// src/app/[locale]/rentals/page.tsx
'use client';

import { RentalCard } from "@/components/RentalCard";
import { useGetRentalListings } from "@/hooks/useGetRentalListings";
import { Loader2, ServerCrash } from "lucide-react";

export default function RentalsPage() {
    const { data: listings, isLoading, isError } = useGetRentalListings();

    return (
        <div className="container mx-auto py-24">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance heading-gradient">
                    Rent Experiences
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance mt-4">
                    Access high-value experiences for a fraction of the cost by renting NFTs and fractions from other users.
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
                    <h2 className="text-2xl font-bold">Failed to Load Listings</h2>
                    <p>There was an error fetching data from the network. Please try again later.</p>
                </div>
            )}

            {!isLoading && listings && (
                listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listings.map(listing => <RentalCard key={listing.listingId} listing={listing} />)}
                    </div>
                ) : (
                    <div className="text-center py-24 text-muted-foreground space-y-4">
                         <ServerCrash className="w-12 h-12 mx-auto" />
                        <h2 className="text-2xl font-bold">No Rentals Available</h2>
                        <p>There are no rental listings available at the moment. Check back soon!</p>
                    </div>
                )
            )}
        </div>
    );
}
