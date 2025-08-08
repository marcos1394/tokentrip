'use client';

import { useMemo } from 'react';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { suiConfig } from '@/config/sui';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatedBackground } from "@/components/animated-background";

// Componentes
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListableNftCard } from '@/components/ListableNftCard';
import { ProofOfExperienceCard } from '@/components/ProofOfExperienceCard';
import { PurchaseReceiptCard } from '@/components/PurchaseReceiptCard';
import { ManageableRentalCard } from '@/components/dashboard/ManageableRentalCard';
import { RentedReceiptCard } from '@/components/dashboard/RentedReceiptCard';
import { Loader2, Store, BadgeCheck, PackageOpen, Inbox, History, Edit, Star, BarChart2, Coins, Key, Landmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useGetLoanRequests, LoanRequest } from '@/hooks/useGetLoanRequest';
import { useGetActiveLoans, ActiveLoan } from '@/hooks/useGetActiveLoans';
import { LoanRequestManagementCard } from '@/components/LoanRequestManagementCard';
import { ActiveLoanCard } from '@/components/ActiveLoanCard';

// Interfaces
interface SuiObject { data: { objectId: string; content: { fields: any; }; display?: any; }; }
interface ProviderProfile extends SuiObject {}
interface ExperienceNFT extends SuiObject {}
interface PurchaseReceipt extends SuiObject {}
interface ProofOfExperience extends SuiObject {}
interface RentalListing extends SuiObject {}
interface RentalReceipt extends SuiObject {}

// Sub-componentes
function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (<Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{value}</div></CardContent></Card>);
}
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
    return (<div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg"><Icon className="w-12 h-12" /><p className="text-lg font-semibold">{title}</p><p>{description}</p></div>);
}

function LoadingSkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[180px] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                </div>
            ))}
        </div>
    );
}

// --- Componente para el Dashboard de USUARIO (No Proveedor) ---
function UserDashboard({ nfts, poes, receipts, rentedReceipts, myLoanRequests, myBorrowedLoans, myLendedLoans }: { nfts: ExperienceNFT[], poes: ProofOfExperience[], receipts: PurchaseReceipt[], rentedReceipts: RentalReceipt[], myLoanRequests: LoanRequest[], myBorrowedLoans: ActiveLoan[], myLendedLoans: ActiveLoan[] }) {
    const params = useParams();
    const locale = params.locale;
    const queryClient = useQueryClient();

    const handleActionSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['getOwnedObjects'] });
        queryClient.invalidateQueries({ queryKey: ['get-loan-requests-graphql'] });
        queryClient.invalidateQueries({ queryKey: ['get-active-loans-graphql'] });
    };

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold heading-gradient">My Dashboard</h1>
            <Tabs defaultValue="collection" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="collection">My Collection</TabsTrigger>
                    <TabsTrigger value="memories">My Memories</TabsTrigger>
                    <TabsTrigger value="rentals">My Rentals</TabsTrigger>
                    <TabsTrigger value="loans">My Loans</TabsTrigger>
                    <TabsTrigger value="reviews">Pending Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="collection" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {nfts.filter(nft => nft.data?.display).map((nft) => (
                            <ListableNftCard key={nft.data.objectId} nft={nft.data} onActionSuccess={handleActionSuccess} isFraction={false} />
                        ))}
                    </div>
                    {nfts.length === 0 && <EmptyState icon={Inbox} title="Your Collection is Empty" description="Purchase an experience NFT from the marketplace to see it here." />}
                </TabsContent>
                
                {/* --- SECCIÓN RESTAURADA DE USUARIO --- */}
                <TabsContent value="memories" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{poes.map((poe) => ( <ProofOfExperienceCard key={poe.data.objectId} poe={poe.data} /> ))}</div>
                    {poes.length === 0 && <EmptyState icon={History} title="You have no Memories yet" description="Redeem an experience NFT after you attend to collect a permanent, on-chain memento." />}
                </TabsContent>
                <TabsContent value="rentals" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {rentedReceipts.map((receipt) => ( <RentedReceiptCard key={receipt.data.objectId} receipt={receipt.data} /> ))}
                    </div>
                    {rentedReceipts.length === 0 && <EmptyState icon={Key} title="You haven't rented any items" description="Rented items will appear here." />}
                </TabsContent>
                <TabsContent value="loans" className="mt-6">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-4">My Loan Requests</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {myLoanRequests.map(req => <LoanRequestManagementCard key={req.requestId} request={req} onActionSuccess={handleActionSuccess} />)}
                            </div>
                            {myLoanRequests.length === 0 && <EmptyState icon={Landmark} title="No Active Loan Requests" description="You can request a loan from your collection." />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mt-8 mb-4">Loans I've Borrowed</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {myBorrowedLoans.map(loan => <ActiveLoanCard key={loan.loanId} loan={loan} role="borrower" onActionSuccess={handleActionSuccess} />)}
                            </div>
                            {myBorrowedLoans.length === 0 && <EmptyState icon={Landmark} title="No Active Borrows" description="Loans you take will appear here." />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mt-8 mb-4">Loans I've Lended</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {myLendedLoans.map(loan => <ActiveLoanCard key={loan.loanId} loan={loan} role="lender" onActionSuccess={handleActionSuccess} />)}
                            </div>
                            {myLendedLoans.length === 0 && <EmptyState icon={Landmark} title="No Active Loans" description="Loans you fund will appear here." />}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="reviews" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{receipts.map((receipt) => ( <PurchaseReceiptCard key={receipt.data.objectId} receipt={receipt.data} /> ))}</div>
                    {receipts.length === 0 && <EmptyState icon={Edit} title="No Pending Reviews" description="After you purchase an experience, you'll find a receipt here to leave a review." />}
                </TabsContent>
                {/* --- FIN SECCIÓN RESTAURADA --- */}

            </Tabs>
            <Card className="glass-card text-center mt-12">
                <CardHeader><CardTitle className="text-2xl">Want to Sell Experiences?</CardTitle><CardDescription>Become a provider to tokenize and sell your unique offerings.</CardDescription></CardHeader>
                <CardContent><Button asChild className="btn-sui"><Link href={`/${locale}/provider/register`}>Create a Provider Profile</Link></Button></CardContent>
            </Card>
        </div>
    );
}

function ProviderDashboard({ providerProfile, nfts, poes, receipts, rentalListings, rentedReceipts, myLoanRequests, myBorrowedLoans, myLendedLoans }: { 
    providerProfile: ProviderProfile, 
    nfts: ExperienceNFT[], 
    poes: ProofOfExperience[], 
    receipts: PurchaseReceipt[], 
    rentalListings: RentalListing[], 
    rentedReceipts: RentalReceipt[],
    myLoanRequests: LoanRequest[],
    myBorrowedLoans: ActiveLoan[],
    myLendedLoans: ActiveLoan[]
}) {
    const queryClient = useQueryClient();
    
    // Acceso seguro a los campos del perfil para evitar errores con 'undefined'.
    const providerProfileFields = providerProfile?.data?.content?.fields;

    // Si los campos del perfil no están listos, muestra un estado de carga.
    // Esta es la verificación de seguridad principal que previene el crash.
    if (!providerProfileFields) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10" /></div>;
    }

    // Aseguramos que 'active_listings' sea un array antes de usarlo.
    const activeListingIds = providerProfileFields.active_listings || [];

    const { data: activeListings, isLoading: isLoadingActiveListings } = useSuiClientQuery('multiGetObjects', { 
        ids: activeListingIds, 
        options: { showContent: true } 
    }, { 
        enabled: activeListingIds.length > 0 
    });
    
    const handleActionSuccess = () => { 
        queryClient.invalidateQueries({ queryKey: ['getOwnedObjects', 'multiGetObjects'] });
        queryClient.invalidateQueries({ queryKey: ['get-loan-requests-graphql'] });
        queryClient.invalidateQueries({ queryKey: ['get-active-loans-graphql'] });
    };

    const totalReviews = Number(providerProfileFields.total_reviews || 0);
    const averageRating = totalReviews > 0 ? (Number(providerProfileFields.total_rating_points || 0) / totalReviews).toFixed(1) : "N/A";

    return (
        <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">Provider Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Active Listings" value={activeListingIds.length} icon={Store} />
                <StatCard title="Total Reviews" value={totalReviews} icon={Star} />
                <StatCard title="Average Rating" value={averageRating} icon={BarChart2} />
                <StatCard title="Lifetime Sales (SUI)" value="Coming Soon" icon={Coins} />
            </div>
            <Tabs defaultValue="listings" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="listings">Active Listings</TabsTrigger>
                    <TabsTrigger value="inventory">My Inventory</TabsTrigger>
                    <TabsTrigger value="rentals">My Rentals</TabsTrigger>
                    <TabsTrigger value="loans">My Loans</TabsTrigger>
                    <TabsTrigger value="reviews">My Receipts</TabsTrigger>
                </TabsList>

                <TabsContent value="listings" className="mt-6">
                    {isLoadingActiveListings && <LoadingSkeletonGrid />}
                    {activeListings && activeListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {activeListings.map((listing: any) => (
                                listing?.data?.content && 
                                <ListableNftCard 
                                    key={listing.data.objectId} 
                                    nft={listing.data.content.fields.nft} 
                                    listingData={listing.data} 
                                    onActionSuccess={handleActionSuccess} 
                                    isListing 
                                />
                            ))}
                        </div>
                    ) : (!isLoadingActiveListings && <EmptyState icon={PackageOpen} title="You have no active listings" description="List an item from your inventory to get started!" />)}
                </TabsContent>

                <TabsContent value="inventory" className="mt-6">
                    {(() => {
                        const filteredNfts = nfts.filter(nft => nft.data?.display);
                        return filteredNfts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredNfts.map((nft) => (
                                    <ListableNftCard 
                                        key={nft.data.objectId} 
                                        nft={nft.data} 
                                        onActionSuccess={handleActionSuccess} 
                                        providerProfileId={providerProfile.data.objectId}
                                        isFraction={false}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={Inbox} title="Your inventory is empty" description="As an admin, mint a new experience to this address to see it here." />
                        )
                    })()}
                </TabsContent>

                <TabsContent value="rentals" className="mt-6">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Items I've Listed for Rent</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{rentalListings.map(listing => <ManageableRentalCard key={listing.data.objectId} listing={listing.data} />)}</div>
                            {rentalListings.length === 0 && <EmptyState icon={Key} title="You have no items listed for rent" description="List a fraction or NFT from your inventory to start earning." />}
                        </div>
                        <div>
                             <h3 className="text-2xl font-bold mt-8 mb-4">Items Rented From Me</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{rentedReceipts.map((receipt) => ( <RentedReceiptCard key={receipt.data.objectId} receipt={receipt.data} /> ))}</div>
                            {rentedReceipts.length === 0 && <EmptyState icon={Key} title="No items have been rented from you" description="Rented items will appear here." />}
                        </div>
                    </div>
                </TabsContent>
                
                {/* --- SECCIÓN DE PRÉSTAMOS RESTAURADA --- */}
                <TabsContent value="loans" className="mt-6">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-4">My Loan Requests</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {myLoanRequests.map(req => <LoanRequestManagementCard key={req.requestId} request={req} onActionSuccess={handleActionSuccess} />)}
                            </div>
                            {myLoanRequests.length === 0 && <EmptyState icon={Landmark} title="No Active Loan Requests" description="You can request a loan from your collection." />}
                        </div>
                        
                        <div>
                            <h3 className="text-2xl font-bold mt-8 mb-4">Loans I've Borrowed</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {myBorrowedLoans.map(loan => <ActiveLoanCard key={loan.loanId} loan={loan} role="borrower" onActionSuccess={handleActionSuccess} />)}
                            </div>
                            {myBorrowedLoans.length === 0 && <EmptyState icon={Landmark} title="No Active Borrows" description="Loans you take will appear here." />}
                        </div>
                        
                        <div>
                            <h3 className="text-2xl font-bold mt-8 mb-4">Loans I've Lended</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {myLendedLoans.map(loan => <ActiveLoanCard key={loan.loanId} loan={loan} role="lender" onActionSuccess={handleActionSuccess} />)}
                            </div>
                            {myLendedLoans.length === 0 && <EmptyState icon={Landmark} title="No Active Loans" description="Loans you fund will appear here." />}
                        </div>
                    </div>
                </TabsContent>
                
                {/* --- SECCIÓN DE "MEMORIES" TAMBIÉN RESTAURADA --- */}
                <TabsContent value="memories" className="mt-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{poes.map((poe) => ( <ProofOfExperienceCard key={poe.data.objectId} poe={poe.data} /> ))}</div>
                   {poes.length === 0 && <EmptyState icon={History} title="You have no Memories yet" description="Redeem an experience NFT after a customer attends to add to your collection." />}
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{receipts.map((receipt) => ( <PurchaseReceiptCard key={receipt.data.objectId} receipt={receipt.data} /> ))}</div>
                    {receipts.length === 0 && <EmptyState icon={Edit} title="No Pending Reviews" description="After a customer buys from you, their receipt will appear here until they leave a review." />}
                </TabsContent>
            </Tabs>
        </div>
    );
}


// --- COMPONENTE CLIENTE CORREGIDO ---
export default function DashboardClient() {
    const account = useCurrentAccount();
    const ownerAddress = account?.address;

    // --- LA CORRECCIÓN ESTÁ AQUÍ ---
    // 1. Llamamos a TODOS los hooks de forma incondicional en la parte superior.
    // 2. Usamos la opción `enabled: !!ownerAddress` para que las queries solo se activen
    //    cuando la dirección del usuario esté disponible.
    
    const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery(
        'getOwnedObjects', 
        { owner: ownerAddress!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` }, limit: 1, options: { showContent: true } }, 
        { enabled: !!ownerAddress }
    );
    const { data: nftsData, isLoading: isLoadingNfts } = useSuiClientQuery(
        'getOwnedObjects', 
        { owner: ownerAddress!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ExperienceNFT` }, options: { showContent: true, showDisplay: true } }, 
        { enabled: !!ownerAddress }
    );
    const { data: poesData, isLoading: isLoadingPoes } = useSuiClientQuery('getOwnedObjects', { owner: ownerAddress!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProofOfExperience` }, options: { showContent: true } }, { enabled: !!ownerAddress });
    const { data: receiptsData, isLoading: isLoadingReceipts } = useSuiClientQuery('getOwnedObjects', { owner: ownerAddress!, filter: { StructType: `${suiConfig.packageId}::experience_nft::PurchaseReceipt` }, options: { showContent: true } }, { enabled: !!ownerAddress });
    const { data: rentalListingsData, isLoading: isLoadingListings } = useSuiClientQuery('getOwnedObjects', { owner: ownerAddress!, filter: { StructType: `${suiConfig.rentalPackageId}::rental_market::RentalListing` }, options: { showContent: true } }, { enabled: !!ownerAddress });
    const { data: rentedReceiptsData, isLoading: isLoadingReceiptsRental } = useSuiClientQuery('getOwnedObjects', { owner: ownerAddress!, filter: { StructType: `${suiConfig.rentalPackageId}::rental_market::RentalReceipt` }, options: { showContent: true } }, { enabled: !!ownerAddress });

    const { data: allLoanRequests, isLoading: isLoadingRequests } = useGetLoanRequests();
    const { data: allActiveLoans, isLoading: isLoadingLoans } = useGetActiveLoans();

    // El estado de carga ahora funciona correctamente porque los hooks siempre están presentes.
    const isLoading = (!!ownerAddress && (isLoadingProfile || isLoadingNfts || isLoadingPoes || isLoadingReceipts || isLoadingListings || isLoadingReceiptsRental || isLoadingRequests || isLoadingLoans));

    const isProvider = useMemo(() => !!providerData?.data && providerData.data.length > 0, [providerData]);
    
    const providerProfile = providerData?.data?.[0] as ProviderProfile | undefined;
    const nfts = (nftsData?.data?.filter(obj => obj.data) as ExperienceNFT[]) ?? [];
    const poes = (poesData?.data?.filter(obj => obj.data) as ProofOfExperience[]) ?? [];
    const receipts = (receiptsData?.data?.filter(obj => obj.data) as PurchaseReceipt[]) ?? [];
    const rentalListings = (rentalListingsData?.data?.filter(obj => obj.data) as RentalListing[]) ?? [];
    const rentedReceipts = (rentedReceiptsData?.data?.filter(obj => obj.data) as RentalReceipt[]) ?? [];
    
    const myLoanRequests = useMemo(() => allLoanRequests?.filter(req => req.borrower === ownerAddress) ?? [], [allLoanRequests, ownerAddress]);
    const myBorrowedLoans = useMemo(() => allActiveLoans?.filter(loan => loan.borrower === ownerAddress) ?? [], [allActiveLoans, ownerAddress]);
    const myLendedLoans = useMemo(() => allActiveLoans?.filter(loan => loan.lender === ownerAddress) ?? [], [allActiveLoans, ownerAddress]);
    
    // 3. La lógica de renderizado condicional ahora solo afecta al JSX.
    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                {!ownerAddress || isLoading ? (
                    <div className="flex items-center justify-center pt-24"><Loader2 className="animate-spin h-10 w-10" /></div>
                ) : (
                    isProvider && providerProfile ? 
                        <ProviderDashboard 
                            providerProfile={providerProfile} nfts={nfts} poes={poes} receipts={receipts} 
                            rentalListings={rentalListings} rentedReceipts={rentedReceipts} 
                            myLoanRequests={myLoanRequests} myBorrowedLoans={myBorrowedLoans} myLendedLoans={myLendedLoans}
                        /> : 
                        <UserDashboard 
                            nfts={nfts} poes={poes} receipts={receipts} rentedReceipts={rentedReceipts}
                            myLoanRequests={myLoanRequests} myBorrowedLoans={myBorrowedLoans} myLendedLoans={myLendedLoans}
                        />
                )}
            </div>
        </div>
    );
}