'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCurrentWallet, useSignAndExecuteTransaction, useSuiClientQuery, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { WalrusClient, WalrusFile } from '@mysten/walrus';

// Componentes y UI
import { MiniSwap } from '@/components/MiniSwap';
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Store, Loader2, BadgeCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProviderInfoCard } from '@/components/provider/ProviderInfoCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * --- LA CORRECCIÓN ESTÁ AQUÍ ---
 * Esta función intercepta las llamadas de Walrus y las redirige a nuestro backend.
 * Ahora maneja los encabezados de forma segura para TypeScript.
 */
const proxyFetch: typeof fetch = async (url, options) => {
  console.log(`[PROXY FETCH] Interceptando llamada a: ${url}`);
  
  // Creamos un objeto Headers para normalizar el formato y acceder de forma segura.
  const requestHeaders = new Headers(options?.headers);
  
  return fetch('/api/walrus-proxy', {
    method: 'POST',
    headers: {
      'X-Walrus-Target-URL': url.toString(), 
      // Usamos el método .get(), que es seguro y no distingue mayúsculas/minúsculas.
      'Content-Type': requestHeaders.get('content-type') || 'application/octet-stream',
    },
    body: options?.body,
  });
};


/**
 * Componente principal que maneja los estados de conexión de la wallet
 * y la inicialización segura del WalrusClient a través de nuestro proxy.
 */
export default function RegisterProviderClient() {
    const { currentWallet, connectionStatus } = useCurrentWallet();
    const suiClient = useSuiClient();
    const activeChain = currentWallet?.accounts[0]?.chains[0];
    const [walrusClient, setWalrusClient] = useState<WalrusClient | null>(null);

    useEffect(() => {
        if (suiClient && currentWallet && (activeChain === 'sui:testnet' || activeChain === 'sui:mainnet')) {
            const client = new WalrusClient({
                suiClient,
                network: activeChain.slice(4) as 'testnet' | 'mainnet',
                uploadRelay: { host: 'https://upload-relay.testnet.walrus.space' },
                storageNodeClientOptions: { fetch: proxyFetch },
            });
            setWalrusClient(client);
        } else {
            setWalrusClient(null);
        }
    }, [suiClient, currentWallet, activeChain]);

    if (connectionStatus === 'connecting') {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10" /></div>;
    }
    if (connectionStatus === 'disconnected' || !currentWallet?.accounts[0]) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                 <Card className="max-w-md text-center p-8"><CardHeader><AlertCircle className="w-12 h-12 mx-auto text-primary" /><CardTitle className="mt-4">Conecta tu Wallet</CardTitle><CardDescription>Para registrarte como proveedor, por favor conecta tu wallet de Sui.</CardDescription></CardHeader></Card>
            </div>
        );
    }
    if (activeChain !== 'sui:testnet' && activeChain !== 'sui:mainnet') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md text-center p-8"><CardHeader><AlertCircle className="w-12 h-12 mx-auto text-yellow-500" /><CardTitle className="mt-4">Red Incorrecta</CardTitle><CardDescription>Por favor, cambia la red en tu wallet a <strong>Testnet</strong> para continuar.</CardDescription></CardHeader></Card>
            </div>
        );
    }
    return <RegisterFormProvider walrusClient={walrusClient} />;
}

/**
 * Componente que contiene la lógica y el JSX del formulario.
 */
function RegisterFormProvider({ walrusClient }: { walrusClient: WalrusClient | null }) {
    const { currentWallet } = useCurrentWallet();
    const currentAccount = currentWallet?.accounts[0]!;
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const suiClient = useSuiClient();
    const params = useParams();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [category, setCategory] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [isCheckingWal, setIsCheckingWal] = useState(true);
    const [isAcquireWalModalOpen, setIsAcquireWalModalOpen] = useState(false);
    const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';

    const { data: existingProfile, isLoading: isLoadingProfile } = useSuiClientQuery('getOwnedObjects', {
        owner: currentAccount.address,
        filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` },
        limit: 1,
    }, { enabled: !!currentAccount });
    
    const checkWalBalance = useCallback(async () => {
        if (!currentAccount) {
            setIsCheckingWal(false);
            return;
        }
        setIsCheckingWal(true);
        try {
            const balance = await suiClient.getBalance({ owner: currentAccount.address, coinType: WAL_COIN_TYPE });
            if(parseInt(balance.totalBalance) > 0) { console.log("User has WAL.", balance); } 
            else { console.log("User does not have WAL."); }
        } catch (error) {
            console.error("Failed to check WAL balance:", error);
        } finally {
            setIsCheckingWal(false);
        }
    }, [currentAccount, suiClient]);

    useEffect(() => { checkWalBalance(); }, [checkWalBalance]);
    useEffect(() => {
        if (imageFile) {
            const previewUrl = URL.createObjectURL(imageFile);
            setImagePreview(previewUrl);
            return () => URL.revokeObjectURL(previewUrl);
        }
    }, [imageFile]);
    
    const isAlreadyProvider = useMemo(() => existingProfile && existingProfile.data.length > 0, [existingProfile]);
    const isFormInvalid = useMemo(() => !name.trim() || !bio.trim() || !imageFile || !category, [name, bio, imageFile, category]);

    const handleSwapSuccess = () => {
        setIsAcquireWalModalOpen(false);
        toast({ title: "Balance Updated!" });
        checkWalBalance();
    };

    const handleRegister = async () => {
        if (!currentAccount || isFormInvalid || !imageFile || !walrusClient) {
            toast({ variant: "destructive", title: "Error de Validación", description: "Por favor, completa todos los campos." });
            return;
        }
        setIsPending(true);
        try {
            const imageArrayBuffer = await imageFile.arrayBuffer();
            const uint8Array = new Uint8Array(imageArrayBuffer);

            const flow = walrusClient.writeFilesFlow({
                files: [WalrusFile.from({ contents: uint8Array, identifier: imageFile.name })],
            });
            
            await flow.encode();
            toast({ title: "Subiendo imagen (1/3)..." });
            const registerTx = flow.register({ epochs: 53, owner: currentAccount.address, deletable: false });
            const registerResult = await signAndExecuteTransaction({ transaction: registerTx, account: currentAccount });

            toast({ title: "Subiendo imagen (2/3)..." });
            await flow.upload({ digest: registerResult.digest });

            toast({ title: "Subiendo imagen (3/3)..." });
            const certifyTx = flow.certify();
            await signAndExecuteTransaction({ transaction: certifyTx, account: currentAccount });

            const files = await flow.listFiles();
            const finalImageUrl = `https://gateway.walrus.space/blobs/${files[0].blobId}`;

            toast({ title: "Registrando perfil en TokenTrip..." });
            const tx = new Transaction();
            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::register_provider`,
                arguments: [tx.pure.string(name), tx.pure.string(bio), tx.pure.string(finalImageUrl), tx.pure.string(category)],
            });

            const result = await signAndExecuteTransaction({ transaction: tx, account: currentAccount });
            const txResult = await suiClient.waitForTransaction({ digest: result.digest, options: { showEffects: true } });

            if (txResult.effects?.status.status === 'success') {
                toast({ title: "✅ ¡Éxito!", description: "Tu perfil ha sido creado." });
                queryClient.invalidateQueries({ queryKey: ['getOwnedObjects'] });
                setTimeout(() => { router.push(`/${params.locale}/dashboard`); }, 1500);
            } else {
                throw new Error("La transacción de registro falló.");
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Fallo en el Registro", description: error.message || "Ocurrió un error." });
        } finally {
            setIsPending(false);
        }
    };

    if (isLoadingProfile) { return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10" /></div>; }
    if (isAlreadyProvider) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-4">
                <AnimatedBackground />
                <Card className="max-w-md mx-auto glass-card p-8 relative z-10">
                    <CardHeader><BadgeCheck className="w-16 h-16 mx-auto text-green-500" /><CardTitle className="text-2xl mt-4">You're Already a Provider!</CardTitle></CardHeader>
                    <CardContent className='flex flex-col gap-4 mt-4'><Button asChild size="lg" className="w-full btn-sui"><Link href="/dashboard">Go to Dashboard</Link></Button></CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8"><Button asChild variant="outline" className="glass-card"><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link></Button></div>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12"><h1 className="text-4xl font-bold heading-gradient">Become a Provider</h1><p className="text-muted-foreground mt-2">Create your profile to start selling experiences.</p></div>
                    <div className="grid lg:grid-cols-2 gap-12">
                        <Card className="glass-card">
                            <CardHeader><CardTitle>Your Profile Details</CardTitle><CardDescription>This will be public.</CardDescription></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2"><Label>Store or Brand Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>Provider Category</Label>
                                    <Select onValueChange={setCategory} value={category}><SelectTrigger disabled={isPending}><SelectValue placeholder="Select a category..." /></SelectTrigger><SelectContent><SelectItem value="Events">🎟️ Events</SelectItem><SelectItem value="Hospitality">🏨 Hospitality</SelectItem><SelectItem value="Tours">🗺️ Tours</SelectItem><SelectItem value="Digital">🖥️ Digital</SelectItem></SelectContent></Select>
                                </div>
                                <div className="space-y-2"><Label>Short Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>Logo or Profile Image</Label><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} disabled={isPending} className="pt-2"/></div>
                                <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleRegister} disabled={isPending || isCheckingWal || !currentAccount || isFormInvalid || !walrusClient}>
                                    {isCheckingWal ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Store className="w-5 h-5 mr-2" />}
                                    {isCheckingWal ? "Checking Wallet..." : (isPending ? "Registering..." : "Create Provider Profile")}
                                </Button>
                            </CardContent>
                        </Card>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">Live Preview</h3>
                            <ProviderInfoCard name={name || "..."} bio={bio || "..."} imageUrl={imagePreview || "..."} averageRating={0} totalReviews={0} isLoading={false} isVerified={false} />
                        </div>
                    </div>
                </div>
            </div>
            <Dialog open={isAcquireWalModalOpen} onOpenChange={setIsAcquireWalModalOpen}>
                <DialogContent className="glass-card">
                    <DialogHeader><DialogTitle>Storage Token (WAL) Required</DialogTitle><DialogDescription className="pt-2">You need WAL tokens to store your image.</DialogDescription></DialogHeader>
                    <MiniSwap fromCoinType='0x2::sui::SUI' toCoinType={WAL_COIN_TYPE} onSwapSuccess={handleSwapSuccess}/>
                </DialogContent>
            </Dialog>
            <Toaster />
        </div>
    );
}
