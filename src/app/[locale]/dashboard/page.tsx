'use client';

import { useMemo } from 'react';
import { useCurrentAccount, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { suiConfig } from '@/config/sui';

// Componentes
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListableNftCard } from '@/components/ListableNftCard';
import { ProofOfExperienceCard } from '@/components/ProofOfExperienceCard';
import { Loader2, Store, BadgeCheck, PackageOpen, Inbox, History, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';

// Interfaces para los tipos de objetos
interface ProviderProfile {
    data: { objectId: string; content: { fields: any } }
}
interface ExperienceNFT {
    data: { objectId: string; content: { fields: any }, display: any }
}
interface PurchaseReceipt {
    data: { objectId: string; content: { fields: any } }
}
interface ProofOfExperience {
    data: { objectId: string; content: { fields: any } }
}

// --- Componente para el Dashboard de USUARIO (No Proveedor) ---
function UserDashboard({ nfts, poes, receipts }: { nfts: ExperienceNFT[], poes: ProofOfExperience[], receipts: PurchaseReceipt[] }) {
    const params = useParams();
    const locale = params.locale;

    return (
        <div className="space-y-8">
            <Card className="glass-card text-center">
                <CardHeader>
                    <Store className="w-12 h-12 mx-auto text-primary mb-4"/>
                    <CardTitle className="text-2xl">Want to Sell Experiences?</CardTitle>
                    <CardDescription>Become a provider to tokenize and sell your unique offerings on TokenTrip.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="btn-sui">
                        <Link href={`/${locale}/es/provider/register`}>Create a Provider Profile</Link>
                    </Button>
                </CardContent>
            </Card>

            <Tabs defaultValue="collection" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="collection">My Collection</TabsTrigger>
                    <TabsTrigger value="memories">My Memories</TabsTrigger>
                    <TabsTrigger value="reviews">Pending Reviews</TabsTrigger>
                </TabsList>

                {/* Pestaña: Mi Colección */}
                <TabsContent value="collection" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {nfts.map((nft) => ( <ListableNftCard key={nft.data.objectId} nft={nft.data as any} onActionSuccess={() => {}} /> ))}
                    </div>
                    {nfts.length === 0 && <EmptyState icon={Inbox} title="Your Collection is Empty" description="Purchase an experience NFT from the marketplace to see it here." />}
                </TabsContent>

                {/* Pestaña: Mis Recuerdos (Proof of Experience) */}
                <TabsContent value="memories" className="mt-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {poes.map((poe) => ( <ProofOfExperienceCard key={poe.data.objectId} poe={poe.data as any} /> ))}
                    </div>
                     {poes.length === 0 && <EmptyState icon={History} title="You have no Memories yet" description="Redeem an experience NFT after you attend to collect a permanent, on-chain memento." />}
                </TabsContent>

                {/* Pestaña: Reseñas Pendientes */}
                <TabsContent value="reviews" className="mt-6">
                    {/* Aquí iría la lógica para mostrar las tarjetas de PurchaseReceipt */}
                    {receipts.length === 0 && <EmptyState icon={Edit} title="No Pending Reviews" description="After you purchase an experience, you'll find a receipt here to leave a review." />}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- Componente para el Dashboard de PROVEEDOR ---
function ProviderDashboard({ providerProfile, nfts, poes, receipts }: { providerProfile: ProviderProfile, nfts: ExperienceNFT[], poes: ProofOfExperience[], receipts: PurchaseReceipt[] }) {
    // La lógica para las estadísticas y listados activos se queda aquí
    // ...
    return (
        <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground text-balance">Provider Dashboard</h1>
            {/* Aquí irían las estadísticas y las pestañas específicas del proveedor */}
            <p className="text-lg text-muted-foreground">Welcome to your command center.</p>
        </div>
    );
}

// --- Componente de Estado Vacío ---
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
    return (
        <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
            <Icon className="w-12 h-12" />
            <p className="text-lg font-semibold">{title}</p>
            <p>{description}</p>
        </div>
    );
}


// --- PÁGINA PRINCIPAL ---
export default function DashboardPage() {
    const account = useCurrentAccount();
    
    // --- 1. Se obtienen todos los datos necesarios en paralelo ---
    const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery(
        'getOwnedObjects', 
        { owner: account?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` }, limit: 1 },
        { enabled: !!account }
    );

    const { data: nftsData, isLoading: isLoadingNfts } = useSuiClientQuery(
        'getOwnedObjects', 
        { owner: account?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ExperienceNFT` }, options: { showContent: true, showDisplay: true } },
        { enabled: !!account }
    );

    const { data: poesData, isLoading: isLoadingPoes } = useSuiClientQuery(
        'getOwnedObjects', 
        { owner: account?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProofOfExperience` }, options: { showContent: true } },
        { enabled: !!account }
    );

    const { data: receiptsData, isLoading: isLoadingReceipts } = useSuiClientQuery(
        'getOwnedObjects', 
        { owner: account?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::PurchaseReceipt` }, options: { showContent: true } },
        { enabled: !!account }
    );

    // --- 2. Se preparan los datos y se determina el rol del usuario ---
    const isProvider = useMemo(() => providerData?.data?.length > 0, [providerData]);
    const providerProfile = (providerData?.data?.[0] as ProviderProfile | undefined);
    const nfts = (nftsData?.data as ExperienceNFT[] | undefined) ?? [];
    const poes = (poesData?.data as ProofOfExperience[] | undefined) ?? [];
    const receipts = (receiptsData?.data as PurchaseReceipt[] | undefined) ?? [];
    const isLoading = isLoadingProfile || isLoadingNfts || isLoadingPoes || isLoadingReceipts;

    // --- 3. Renderizado Condicional ---
    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                {isLoading ? (
                    <div className="flex items-center justify-center pt-24"><Loader2 className="animate-spin h-10 w-10" /></div>
                ) : (
                    isProvider && providerProfile ? (
                        // Si es proveedor, muestra el dashboard completo
                        <ProviderDashboard providerProfile={providerProfile} nfts={nfts} poes={poes} receipts={receipts} />
                    ) : (
                        // Si es solo usuario, muestra el dashboard de usuario
                        <UserDashboard nfts={nfts} poes={poes} receipts={receipts} />
                    )
                )}
            </div>
        </div>
    );
}
