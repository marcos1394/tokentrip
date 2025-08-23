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
import { 
    Loader2, Store, PackageOpen, Inbox, History, Edit, Star, BarChart2, 
    Coins, Key, Landmark, TrendingUp, Users, Calendar, Activity, 
    DollarSign, ShoppingBag, Clock, Award, Eye, PlusCircle, 
    ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2,
    Sparkles, Target, Zap
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGetLoanRequests, LoanRequest } from '@/hooks/useGetLoanRequest';
import { useGetActiveLoans, ActiveLoan } from '@/hooks/useGetActiveLoans';
import { LoanRequestManagementCard } from '@/components/LoanRequestManagementCard';
import { ActiveLoanCard } from '@/components/ActiveLoanCard';
import { useGetListings, NftListing } from '@/hooks/useGetListings';

// Interfaces
interface SuiObject { data: { objectId: string; content: { fields: any; }; display?: any; }; }
interface ProviderProfile extends SuiObject {}
interface ExperienceNFT extends SuiObject {}
interface PurchaseReceipt extends SuiObject {}
interface ProofOfExperience extends SuiObject {}
interface RentalListing extends SuiObject {}
interface RentalReceipt extends SuiObject {}

// Sub-componentes mejorados
function StatCard({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    changeType = 'neutral',
    description,
    className = ""
}: { 
    title: string, 
    value: string | number, 
    icon: React.ElementType,
    change?: string,
    changeType?: 'positive' | 'negative' | 'neutral',
    description?: string,
    className?: string
}) {
    const changeColor = changeType === 'positive' ? 'text-green-600' : 
                       changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground';
    
    return (
        <Card className={`glass-card hover:shadow-lg transition-all duration-300 group ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
                        {change && (
                            <div className={`text-xs flex items-center gap-1 ${changeColor}`}>
                                {changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                                {changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                                {change}
                            </div>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState({ 
    icon: Icon, 
    title, 
    description, 
    actionText, 
    actionHref,
    className = ""
}: { 
    icon: React.ElementType, 
    title: string, 
    description: string,
    actionText?: string,
    actionHref?: string,
    className?: string
}) {
    return (
        <div className={`text-center text-muted-foreground py-16 flex flex-col items-center gap-6 border-2 border-dashed rounded-xl hover:border-primary/50 transition-colors ${className}`}>
            <div className="p-4 rounded-full bg-muted/50">
                <Icon className="w-12 h-12" />
            </div>
            <div className="space-y-2">
                <p className="text-xl font-semibold text-foreground">{title}</p>
                <p className="max-w-md mx-auto">{description}</p>
            </div>
            {actionText && actionHref && (
                <Button asChild variant="outline" className="mt-4">
                    <Link href={actionHref}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        {actionText}
                    </Link>
                </Button>
            )}
        </div>
    );
}

function LoadingSkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-4">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Widget de progreso mejorado
function ProgressWidget({ 
    title, 
    current, 
    target, 
    description,
    icon: Icon 
}: {
    title: string,
    current: number,
    target: number,
    description: string,
    icon: React.ElementType
}) {
    const percentage = Math.min((current / target) * 100, 100);
    
    return (
        <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{current}</span>
                        <span className="text-sm text-muted-foreground">/ {target}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// Widget de actividad reciente
function ActivityWidget({ activities }: { activities: Array<{
    type: string,
    title: string,
    time: string,
    icon: React.ElementType,
    status: 'success' | 'pending' | 'error'
}> }) {
    const statusColors = {
        success: 'text-green-600 bg-green-100',
        pending: 'text-yellow-600 bg-yellow-100',
        error: 'text-red-600 bg-red-100'
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className={`p-2 rounded-full ${statusColors[activity.status]}`}>
                                <activity.icon className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">{activity.type}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Header mejorado con bienvenida personalizada
function DashboardHeader({ 
    isProvider, 
    providerName,
    totalValue,
    greeting = "Welcome back!"
}: {
    isProvider: boolean,
    providerName?: string,
    totalValue?: string,
    greeting?: string
}) {
    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="mb-8 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <p className="text-muted-foreground mb-1">{getTimeGreeting()}</p>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {isProvider ? `${providerName || 'Provider'} Dashboard` : 'My Dashboard'}
                    </h1>
                    {isProvider && (
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Provider
                            </Badge>
                            {totalValue && (
                                <Badge variant="outline">
                                    Portfolio: {totalValue}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    {!isProvider && (
                        <Button asChild className="btn-sui">
                            <Link href="/provider/register">
                                <Target className="w-4 h-4 mr-2" />
                                Become a Provider
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- Componente para el Dashboard de USUARIO (No Proveedor) ---
function UserDashboard({ 
    nfts, 
    poes, 
    receipts, 
    rentedReceipts, 
    myLoanRequests, 
    myBorrowedLoans, 
    myLendedLoans 
}: { 
    nfts: ExperienceNFT[], 
    poes: ProofOfExperience[], 
    receipts: PurchaseReceipt[], 
    rentedReceipts: RentalReceipt[], 
    myLoanRequests: LoanRequest[], 
    myBorrowedLoans: ActiveLoan[], 
    myLendedLoans: ActiveLoan[] 
}) {
    const params = useParams();
    const locale = params.locale;
    const queryClient = useQueryClient();

    const handleActionSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['getOwnedObjects'] });
        queryClient.invalidateQueries({ queryKey: ['get-loan-requests-graphql'] });
        queryClient.invalidateQueries({ queryKey: ['get-active-loans-graphql'] });
        queryClient.invalidateQueries({ queryKey: ['get-all-listings-definitive'] });
    };

    // Actividades simuladas basadas en los datos reales
    const activities = useMemo(() => {
        const acts = [];
        if (nfts.length > 0) acts.push({ type: 'Collection', title: 'NFT added to collection', time: '2h ago', icon: PackageOpen, status: 'success' as const });
        if (poes.length > 0) acts.push({ type: 'Memory', title: 'New proof of experience', time: '1d ago', icon: Award, status: 'success' as const });
        if (receipts.length > 0) acts.push({ type: 'Review', title: 'Pending review available', time: '3d ago', icon: Edit, status: 'pending' as const });
        if (myLoanRequests.length > 0) acts.push({ type: 'Loan', title: 'Loan request submitted', time: '1w ago', icon: Landmark, status: 'pending' as const });
        return acts;
    }, [nfts, poes, receipts, myLoanRequests]);

    return (
        <div className="space-y-8">
            <DashboardHeader 
                isProvider={false}
                greeting="Welcome to your personal dashboard!"
            />

            {/* Stats principales */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="My NFTs" 
                    value={nfts.length} 
                    icon={PackageOpen}
                    description="Total owned"
                    change={nfts.length > 0 ? "+2 this month" : undefined}
                    changeType="positive"
                />
                <StatCard 
                    title="Memories" 
                    value={poes.length} 
                    icon={Award}
                    description="Proof of experiences"
                    change={poes.length > 0 ? "Recent activity" : undefined}
                    changeType="neutral"
                />
                <StatCard 
                    title="Active Loans" 
                    value={myBorrowedLoans.length + myLendedLoans.length} 
                    icon={Landmark}
                    description="Borrowed + Lended"
                />
                <StatCard 
                    title="Pending Reviews" 
                    value={receipts.length} 
                    icon={Edit}
                    description="Awaiting feedback"
                    change={receipts.length > 0 ? "Action needed" : undefined}
                    changeType={receipts.length > 0 ? "pending" as any : undefined}
                />
            </div>

            {/* Widgets adicionales */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ProgressWidget
                        title="Collection Growth"
                        current={nfts.length}
                        target={10}
                        description="Build your NFT collection"
                        icon={Target}
                    />
                </div>
                <ActivityWidget activities={activities} />
            </div>

            <Tabs defaultValue="collection" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-8">
                    <TabsTrigger value="collection" className="flex items-center gap-2">
                        <PackageOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Collection</span>
                    </TabsTrigger>
                    <TabsTrigger value="memories" className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span className="hidden sm:inline">Memories</span>
                    </TabsTrigger>
                    <TabsTrigger value="rentals" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="hidden sm:inline">Rentals</span>
                    </TabsTrigger>
                    <TabsTrigger value="loans" className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        <span className="hidden sm:inline">Loans</span>
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Reviews</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="collection" className="mt-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">My Collection</h2>
                            <p className="text-muted-foreground">Manage your NFT experiences</p>
                        </div>
                        <Badge variant="secondary">{nfts.length} items</Badge>
                    </div>
                    
                    {nfts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {nfts.filter(nft => nft.data?.display).map((nft) => (
                                <ListableNftCard 
                                    key={nft.data.objectId}
                                    nft={{
                                        objectId: nft.data.objectId,
                                        name: nft.data.display?.data?.name || 'Untitled Experience',
                                        description: nft.data.display?.data?.description || '',
                                        imageUrl: nft.data.display?.data?.image_url || ''
                                    }}
                                    onActionSuccess={handleActionSuccess} 
                                    isFraction={false} 
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={PackageOpen} 
                            title="Your collection awaits"
                            description="Start building your NFT collection by purchasing unique experiences from our marketplace."
                            actionText="Browse Marketplace"
                            actionHref={`/${locale}/marketplace`}
                        />
                    )}
                </TabsContent>

                <TabsContent value="memories" className="mt-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">My Memories</h2>
                            <p className="text-muted-foreground">Your collected proof of experiences</p>
                        </div>
                        <Badge variant="secondary">{poes.length} memories</Badge>
                    </div>

                    {poes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {poes.map((poe) => ( 
                                <ProofOfExperienceCard key={poe.data.objectId} poe={poe.data} /> 
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={Award} 
                            title="No memories yet" 
                            description="Attend experiences and redeem your NFTs to collect permanent, on-chain mementos of your adventures."
                        />
                    )}
                </TabsContent>

                <TabsContent value="rentals" className="mt-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">My Rentals</h2>
                        <p className="text-muted-foreground">Items you've rented from other users</p>
                    </div>

                    {rentedReceipts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {rentedReceipts.map((receipt) => ( 
                                <RentedReceiptCard key={receipt.data.objectId} receipt={receipt.data} /> 
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={Key} 
                            title="No rentals yet" 
                            description="Rent experiences and items from other users to expand your access without full ownership."
                        />
                    )}
                </TabsContent>

                <TabsContent value="loans" className="mt-6">
                    <div className="space-y-8">
                        {/* Loan Requests */}
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">My Loan Requests</h3>
                                    <p className="text-muted-foreground">Active requests for funding</p>
                                </div>
                                <Badge variant="secondary">{myLoanRequests.length} active</Badge>
                            </div>
                            
                            {myLoanRequests.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {myLoanRequests.map(req => 
                                        <LoanRequestManagementCard 
                                            key={req.requestId} 
                                            request={req} 
                                            onActionSuccess={handleActionSuccess} 
                                        />
                                    )}
                                </div>
                            ) : (
                                <EmptyState 
                                    icon={Landmark} 
                                    title="No active loan requests" 
                                    description="Request loans against your NFT collection to unlock liquidity."
                                />
                            )}
                        </div>

                        {/* Borrowed Loans */}
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">Loans I've Borrowed</h3>
                                    <p className="text-muted-foreground">Money you've borrowed</p>
                                </div>
                                <Badge variant="secondary">{myBorrowedLoans.length} active</Badge>
                            </div>
                            
                            {myBorrowedLoans.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {myBorrowedLoans.map(loan => 
                                        <ActiveLoanCard 
                                            key={loan.loanId} 
                                            loan={loan} 
                                            role="borrower" 
                                            onActionSuccess={handleActionSuccess} 
                                        />
                                    )}
                                </div>
                            ) : (
                                <EmptyState 
                                    icon={ArrowDownRight} 
                                    title="No active borrows" 
                                    description="Borrowed funds will appear here with repayment details."
                                />
                            )}
                        </div>

                        {/* Lended Loans */}
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">Loans I've Funded</h3>
                                    <p className="text-muted-foreground">Money you've lent to others</p>
                                </div>
                                <Badge variant="secondary">{myLendedLoans.length} active</Badge>
                            </div>
                            
                            {myLendedLoans.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {myLendedLoans.map(loan => 
                                        <ActiveLoanCard 
                                            key={loan.loanId} 
                                            loan={loan} 
                                            role="lender" 
                                            onActionSuccess={handleActionSuccess} 
                                        />
                                    )}
                                </div>
                            ) : (
                                <EmptyState 
                                    icon={ArrowUpRight} 
                                    title="No active loans" 
                                    description="Fund other users' loan requests to earn interest on your capital."
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Pending Reviews</h2>
                            <p className="text-muted-foreground">Experiences awaiting your feedback</p>
                        </div>
                        <Badge variant={receipts.length > 0 ? "destructive" : "secondary"}>
                            {receipts.length} pending
                        </Badge>
                    </div>

                    {receipts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {receipts.map((receipt) => ( 
                                <PurchaseReceiptCard key={receipt.data.objectId} receipt={receipt.data} /> 
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={CheckCircle2} 
                            title="All caught up!" 
                            description="No pending reviews. Purchase experiences to leave feedback and help the community."
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Call to action para convertirse en proveedor */}
            <Card className="glass-card text-center mt-12 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Ready to Create & Sell?
                    </CardTitle>
                    <CardDescription className="text-base">
                        Transform your unique experiences into NFTs and start earning from your creativity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button asChild className="btn-sui">
                            <Link href={`/${locale}/provider/register`}>
                                <Zap className="w-4 h-4 mr-2" />
                                Become a Provider
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/${locale}/learn`}>
                                Learn More
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Componente para el Dashboard de PROVEEDOR ---
function ProviderDashboard({ 
    providerProfile, 
    nfts, 
    poes, 
    receipts, 
    rentalListings, 
    rentedReceipts, 
    myActiveListings, 
    myLoanRequests, 
    myBorrowedLoans, 
    myLendedLoans 
}: { 
    providerProfile: ProviderProfile, 
    nfts: ExperienceNFT[], 
    poes: ProofOfExperience[], 
    receipts: PurchaseReceipt[], 
    rentalListings: RentalListing[], 
    rentedReceipts: RentalReceipt[],
    myActiveListings: NftListing[],
    myLoanRequests: LoanRequest[],
    myBorrowedLoans: ActiveLoan[],
    myLendedLoans: ActiveLoan[]
}) {
    const queryClient = useQueryClient();
    const providerProfileFields = providerProfile?.data?.content?.fields;

    if (!providerProfileFields) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading your provider dashboard...</p>
                </div>
            </div>
        );
    }
    
    const handleActionSuccess = () => { 
        queryClient.invalidateQueries({ queryKey: ['getOwnedObjects'] });
        queryClient.invalidateQueries({ queryKey: ['get-all-listings-definitive'] });
        queryClient.invalidateQueries({ queryKey: ['get-loan-requests-graphql'] });
        queryClient.invalidateQueries({ queryKey: ['get-active-loans-graphql'] });
    };

    const totalReviews = Number(providerProfileFields.total_reviews || 0);
    const averageRating = totalReviews > 0 ? (Number(providerProfileFields.total_rating_points || 0) / totalReviews).toFixed(1) : "0.0";
    const providerName = providerProfileFields.name || 'Provider';

    // Actividades simuladas para el proveedor
    const activities = useMemo(() => {
        const acts = [];
        if (myActiveListings.length > 0) acts.push({ type: 'Sale', title: 'New listing created', time: '2h ago', icon: Store, status: 'success' as const });
        if (receipts.length > 0) acts.push({ type: 'Review', title: 'Customer review received', time: '1d ago', icon: Star, status: 'success' as const });
        if (rentalListings.length > 0) acts.push({ type: 'Rental', title: 'Item rented out', time: '3d ago', icon: Key, status: 'success' as const });
        if (myLoanRequests.length > 0) acts.push({ type: 'Loan', title: 'Loan request funded', time: '1w ago', icon: Landmark, status: 'pending' as const });
        return acts;
    }, [myActiveListings, receipts, rentalListings, myLoanRequests]);

    const totalInventoryValue = nfts.length * 1.5; // Valor estimado
    const monthlyRevenue = myActiveListings.length * 0.8; // Revenue estimado

    return (
        <div className="space-y-8">
            <DashboardHeader 
                isProvider={true}
                providerName={providerName}
                totalValue={`${totalInventoryValue.toFixed(1)} SUI`}
                greeting="Welcome to your provider dashboard!"
            />

            {/* Stats principales del proveedor */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Active Listings" 
                    value={myActiveListings.length} 
                    icon={Store}
                    description="Items for sale"
                    change={myActiveListings.length > 0 ? "+3 this week" : undefined}
                    changeType="positive"
                />
                <StatCard 
                    title="Total Reviews" 
                    value={totalReviews} 
                    icon={Star}
                    description="Customer feedback"
                    change={totalReviews > 0 ? "Recent reviews" : undefined}
                    changeType="neutral"
                />
                <StatCard 
                    title="Average Rating" 
                    value={`${averageRating}★`} 
                    icon={BarChart2}
                    description="Out of 5 stars"
                    change={Number(averageRating) >= 4.5 ? "Excellent!" : Number(averageRating) >= 4.0 ? "Great!" : "Keep improving"}
                    changeType={Number(averageRating) >= 4.0 ? "positive" : "neutral"}
                />
                <StatCard 
                    title="Monthly Revenue" 
                    value={`${monthlyRevenue.toFixed(1)} SUI`} 
                    icon={Coins}
                    description="This month"
                    change="+12% vs last month"
                    changeType="positive"
                />
            </div>

            {/* Widgets adicionales para proveedor */}
            <div className="grid gap-6 lg:grid-cols-3">
                <ProgressWidget
                    title="Inventory Goal"
                    current={nfts.length}
                    target={20}
                    description="Build your product catalog"
                    icon={Target}
                />
                <ProgressWidget
                    title="Review Target"
                    current={totalReviews}
                    target={50}
                    description="Customer satisfaction goal"
                    icon={Star}
                />
                <ActivityWidget activities={activities} />
            </div>

            <Tabs defaultValue="listings" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-8">
                    <TabsTrigger value="listings" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span className="hidden sm:inline">Listings</span>
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="flex items-center gap-2">
                        <PackageOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Inventory</span>
                    </TabsTrigger>
                    <TabsTrigger value="rentals" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="hidden sm:inline">Rentals</span>
                    </TabsTrigger>
                    <TabsTrigger value="loans" className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        <span className="hidden sm:inline">Loans</span>
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Receipts</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="listings" className="mt-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Active Listings</h2>
                            <p className="text-muted-foreground">Your items currently for sale</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary">{myActiveListings.length} active</Badge>
                            <Button asChild>
                                <Link href="/create">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    New Listing
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {myActiveListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {myActiveListings.map((listing) => (
                                <ListableNftCard 
                                    key={listing.listingId} 
                                    nft={{
                                        ...listing.nft,
                                        objectId: listing.nft.id 
                                    }}
                                    listingData={{ 
                                        data: { 
                                            objectId: listing.listingId, 
                                            content: { 
                                                fields: { 
                                                    price: (listing.price * (10**9)).toString(), 
                                                    is_available: true, 
                                                    seller: listing.seller, 
                                                    nft: listing.nft 
                                                } 
                                            } 
                                        } 
                                    }} 
                                    onActionSuccess={handleActionSuccess} 
                                    isListing 
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={Store} 
                            title="No active listings"
                            description="List items from your inventory to start selling and earning revenue."
                            actionText="Create Listing"
                            actionHref="/inventory"
                        />
                    )}
                </TabsContent>

                <TabsContent value="inventory" className="mt-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">My Inventory</h2>
                            <p className="text-muted-foreground">NFTs ready to list or manage</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary">{nfts.length} items</Badge>
                            <Button asChild>
                                <Link href="/create">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Mint New NFT
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {nfts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {nfts.map((nft) => (
                                <ListableNftCard 
                                    key={nft.data.objectId}
                                    nft={{
                                        objectId: nft.data.objectId,
                                        name: nft.data.display?.data?.name || 'Untitled Experience',
                                        description: nft.data.display?.data?.description || '',
                                        imageUrl: nft.data.display?.data?.image_url || ''
                                    }}
                                    onActionSuccess={handleActionSuccess} 
                                    providerProfileId={providerProfile.data.objectId}
                                    isFraction={false}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={PackageOpen} 
                            title="Your inventory is empty"
                            description="Create your first NFT experience to start building your catalog and attracting customers."
                            actionText="Mint First NFT"
                            actionHref="/create"
                        />
                    )}
                </TabsContent>
                
                <TabsContent value="rentals" className="mt-6">
                    <div className="space-y-8">
                        {/* Items listed for rent */}
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">Rental Listings</h3>
                                    <p className="text-muted-foreground">Items you've listed for rent</p>
                                </div>
                                <Badge variant="secondary">{rentalListings.length} listed</Badge>
                            </div>
                            
                            {rentalListings.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {rentalListings.map(listing => 
                                        <ManageableRentalCard 
                                            key={listing.data.objectId} 
                                            listing={listing.data} 
                                        />
                                    )}
                                </div>
                            ) : (
                                <EmptyState 
                                    icon={Key} 
                                    title="No rental listings"
                                    description="List NFTs or fractions from your inventory for rent to generate passive income."
                                />
                            )}
                        </div>

                        {/* Items rented out */}
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">Currently Rented</h3>
                                    <p className="text-muted-foreground">Items rented from you</p>
                                </div>
                                <Badge variant="secondary">{rentedReceipts.length} rented</Badge>
                            </div>
                            
                            {rentedReceipts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {rentedReceipts.map((receipt) => ( 
                                        <RentedReceiptCard key={receipt.data.objectId} receipt={receipt.data} /> 
                                    ))}
                                </div>
                            ) : (
                                <EmptyState 
                                    icon={Clock} 
                                    title="No active rentals"
                                    description="When customers rent your items, their receipts will appear here."
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="loans" className="mt-6">
                    <div className="space-y-8">
                        {/* Loan Requests */}
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">My Loan Requests</h3>
                                    <p className="text-muted-foreground">Funding requests against your assets</p>
                                </div>
                                <Badge variant="secondary">{myLoanRequests.length} active</Badge>
                            </div>
                            
                            {myLoanRequests.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {myLoanRequests.map(req => 
                                        <LoanRequestManagementCard 
                                            key={req.requestId} 
                                            request={req} 
                                            onActionSuccess={handleActionSuccess} 
                                        />
                                    )}
                                </div>
                            ) : (
                                <EmptyState 
                                    icon={Landmark} 
                                    title="No active loan requests"
                                    description="Use your NFT collection as collateral to request funding for your business needs."
                                />
                            )}
                        </div>
                        
                        {/* Borrowed Loans */}
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">Loans I've Borrowed</h3>
                                    <p className="text-muted-foreground">Capital borrowed for business growth</p>
                                </div>
                                <Badge variant="secondary">{myBorrowedLoans.length} active</Badge>
                            </div>
                            
                            {myBorrowedLoans.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {myBorrowedLoans.map(loan => 
                                        <ActiveLoanCard 
                                            key={loan.loanId} 
                                            loan={loan} 
                                            role="borrower" 
                                            onActionSuccess={handleActionSuccess} 
                                        />
                                    )}
                                </div>
                            ) : (
                                <EmptyState 
                                    icon={ArrowDownRight} 
                                    title="No active borrows"
                                    description="Borrowed funds for business expansion will appear here with repayment schedules."
                                />
                            )}
                        </div>
                        
                        {/* Lended Loans */}
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">Loans I've Funded</h3>
                                    <p className="text-muted-foreground">Capital lent to other users</p>
                                </div>
                                <Badge variant="secondary">{myLendedLoans.length} active</Badge>
                            </div>
                            
                            {myLendedLoans.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {myLendedLoans.map(loan => 
                                        <ActiveLoanCard 
                                            key={loan.loanId} 
                                            loan={loan} 
                                            role="lender" 
                                            onActionSuccess={handleActionSuccess} 
                                        />
                                    )}
                                </div>
                            ) : (
                                <EmptyState 
                                    icon={ArrowUpRight} 
                                    title="No active investments"
                                    description="Invest in other users' loan requests to diversify your portfolio and earn interest."
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Customer Receipts</h2>
                            <p className="text-muted-foreground">Pending customer reviews and feedback</p>
                        </div>
                        <Badge variant={receipts.length > 0 ? "default" : "secondary"}>
                            {receipts.length} pending
                        </Badge>
                    </div>

                    {receipts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {receipts.map((receipt) => ( 
                                <PurchaseReceiptCard key={receipt.data.objectId} receipt={receipt.data} /> 
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={CheckCircle2} 
                            title="No pending reviews"
                            description="Customer purchase receipts awaiting reviews will appear here. Great customer service leads to better ratings!"
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Provider insights y growth tips */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Growth Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-sm">Inventory Diversity</span>
                                <Badge variant="outline">{nfts.length > 5 ? "Good" : "Needs Work"}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-sm">Customer Satisfaction</span>
                                <Badge variant="outline">
                                    {Number(averageRating) >= 4.5 ? "Excellent" : 
                                     Number(averageRating) >= 4.0 ? "Good" : "Improving"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-sm">Market Presence</span>
                                <Badge variant="outline">{myActiveListings.length > 3 ? "Active" : "Growing"}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-secondary" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/create">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Create New Experience
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/analytics">
                                    <BarChart2 className="w-4 h-4 mr-2" />
                                    View Analytics
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/customers">
                                    <Users className="w-4 h-4 mr-2" />
                                    Customer Management
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- COMPONENTE CLIENTE FINAL CON TODA LA LÓGICA INTEGRADA ---
export default function DashboardClient() {
    const account = useCurrentAccount();
    const ownerAddress = account?.address;

    // --- QUERIES PARA TODOS LOS DATOS (Lógica original mantenida) ---
    const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery('getOwnedObjects', { 
        owner: ownerAddress!, 
        filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` }, 
        limit: 1, 
        options: { showContent: true } 
    }, { enabled: !!ownerAddress });
    
    const { data: nftsData, isLoading: isLoadingNfts } = useSuiClientQuery('getOwnedObjects', { 
        owner: ownerAddress!, 
        filter: { StructType: `${suiConfig.packageId}::experience_nft::ExperienceNFT` }, 
        options: { showContent: true, showDisplay: true } 
    }, { enabled: !!ownerAddress });
    
    const { data: poesData, isLoading: isLoadingPoes } = useSuiClientQuery('getOwnedObjects', { 
        owner: ownerAddress!, 
        filter: { StructType: `${suiConfig.packageId}::experience_nft::ProofOfExperience` }, 
        options: { showContent: true } 
    }, { enabled: !!ownerAddress });
    
    const { data: receiptsData, isLoading: isLoadingReceipts } = useSuiClientQuery('getOwnedObjects', { 
        owner: ownerAddress!, 
        filter: { StructType: `${suiConfig.packageId}::experience_nft::PurchaseReceipt` }, 
        options: { showContent: true } 
    }, { enabled: !!ownerAddress });
    
    const { data: rentalListingsData, isLoading: isLoadingListings } = useSuiClientQuery('getOwnedObjects', { 
        owner: ownerAddress!, 
        filter: { StructType: `${suiConfig.rentalPackageId}::rental_market::RentalListing` }, 
        options: { showContent: true } 
    }, { enabled: !!ownerAddress });
    
    const { data: rentedReceiptsData, isLoading: isLoadingReceiptsRental } = useSuiClientQuery('getOwnedObjects', { 
        owner: ownerAddress!, 
        filter: { StructType: `${suiConfig.rentalPackageId}::rental_market::RentalReceipt` }, 
        options: { showContent: true } 
    }, { enabled: !!ownerAddress });
    
    const { data: allLoanRequests, isLoading: isLoadingRequests } = useGetLoanRequests();
    const { data: allActiveLoans, isLoading: isLoadingLoans } = useGetActiveLoans();
    const { data: allListings, isLoading: isLoadingAllListings } = useGetListings();

    const isLoading = (!!ownerAddress && (
        isLoadingProfile || isLoadingNfts || isLoadingPoes || 
        isLoadingReceipts || isLoadingListings || isLoadingReceiptsRental || 
        isLoadingRequests || isLoadingLoans || isLoadingAllListings
    ));

    const isProvider = useMemo(() => !!providerData?.data && providerData.data.length > 0, [providerData]);
    
    // --- PROCESAMIENTO Y FILTRADO DE DATOS (Lógica original mantenida) ---
    const providerProfile = providerData?.data?.[0] as ProviderProfile | undefined;
    const providerId = providerProfile?.data?.objectId;

    const myActiveListings = useMemo(() => {
        if (!providerId || !allListings) return [];
        return allListings.filter(listing => listing.providerId === providerId);
    }, [allListings, providerId]);

    const nfts = (nftsData?.data?.filter(obj => obj.data) as ExperienceNFT[]) ?? [];
    const poes = (poesData?.data?.filter(obj => obj.data) as ProofOfExperience[]) ?? [];
    const receipts = (receiptsData?.data?.filter(obj => obj.data) as PurchaseReceipt[]) ?? [];
    const rentalListings = (rentalListingsData?.data?.filter(obj => obj.data) as RentalListing[]) ?? [];
    const rentedReceipts = (rentedReceiptsData?.data?.filter(obj => obj.data) as RentalReceipt[]) ?? [];
    
    const myLoanRequests = useMemo(() => 
        allLoanRequests?.filter(req => req.borrower === ownerAddress) ?? [], 
        [allLoanRequests, ownerAddress]
    );
    const myBorrowedLoans = useMemo(() => 
        allActiveLoans?.filter(loan => loan.borrower === ownerAddress) ?? [], 
        [allActiveLoans, ownerAddress]
    );
    const myLendedLoans = useMemo(() => 
        allActiveLoans?.filter(loan => loan.lender === ownerAddress) ?? [], 
        [allActiveLoans, ownerAddress]
    );
    
    // Estado de carga mejorado
    if (!ownerAddress || isLoading) {
        return (
            <div className="min-h-screen pt-24 pb-12 bg-background">
                <AnimatedBackground />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center justify-center pt-24 space-y-8">
                        <div className="text-center space-y-4">
                            <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" />
                            <h2 className="text-2xl font-bold">Loading your dashboard...</h2>
                            <p className="text-muted-foreground">We're preparing your personalized experience</p>
                        </div>
                        <LoadingSkeletonGrid />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                {isProvider && providerProfile ? 
                    <ProviderDashboard 
                        providerProfile={providerProfile} 
                        nfts={nfts} 
                        poes={poes} 
                        receipts={receipts} 
                        rentalListings={rentalListings} 
                        rentedReceipts={rentedReceipts} 
                        myActiveListings={myActiveListings} 
                        myLoanRequests={myLoanRequests} 
                        myBorrowedLoans={myBorrowedLoans} 
                        myLendedLoans={myLendedLoans}
                    /> : 
                    <UserDashboard 
                        nfts={nfts} 
                        poes={poes} 
                        receipts={receipts} 
                        rentedReceipts={rentedReceipts}
                        myLoanRequests={myLoanRequests} 
                        myBorrowedLoans={myBorrowedLoans} 
                        myLendedLoans={myLendedLoans}
                    />
                }
            </div>
        </div>
    );
}
