'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCurrentWallet, useSignAndExecuteTransaction, useSuiClientQuery, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Componentes
import { MiniSwap } from '@/components/MiniSwap';
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Store, Loader2, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProviderInfoCard } from '@/components/provider/ProviderInfoCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWalrus } from '@/hooks/useWalrus';
import { useQueryClient } from '@tanstack/react-query';

export default function RegisterProviderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { currentWallet } = useCurrentWallet();
    const { walrusClient } = useWalrus();
    const queryClient = useQueryClient();
    const suiClient = useSuiClient();
    const params = useParams();
    const currentAccount = currentWallet?.accounts[0];

    // Estados para el formulario
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [category, setCategory] = useState('');
    const [isPending, setIsPending] = useState(false);

    // --- ESTADOS Y LÓGICA PARA VERIFICACIÓN DE WAL ---
    const [hasWal, setHasWal] = useState(false);
    const [isCheckingWal, setIsCheckingWal] = useState(true);
    const [isAcquireWalModalOpen, setIsAcquireWalModalOpen] = useState(false);
    const WAL_COIN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';

    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

    const { data: existingProfile, isLoading: isLoadingProfile } = useSuiClientQuery('getOwnedObjects', {
        owner: currentAccount?.address!,
        filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` },
        limit: 1,
    }, { enabled: !!currentAccount });
    
    // Función para verificar el balance de WAL
    const checkWalBalance = useCallback(async () => {
        // Si no hay cuenta, no hacemos nada y terminamos el estado de carga.
        if (!currentAccount) {
            setIsCheckingWal(false);
            return;
        }

        console.log("Checking WAL balance for:", currentAccount.address);
        setIsCheckingWal(true);
        try {
            const balance = await suiClient.getBalance({ owner: currentAccount.address, coinType: WAL_COIN_TYPE });
            if (parseInt(balance.totalBalance) > 0) {
                console.log("User has WAL.", balance);
                setHasWal(true);
            } else {
                console.log("User does not have WAL.");
                setHasWal(false);
            }
        } catch (error) {
            console.error("Failed to check WAL balance:", error);
            setHasWal(false); // Si hay un error, asumimos que no tiene WAL
        } finally {
            setIsCheckingWal(false); // Esto se ejecutará siempre, con o sin error
        }
    }, [currentAccount, suiClient]);

    useEffect(() => {
        checkWalBalance();
    }, [checkWalBalance]);

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
        toast({ title: "Balance Updated!", description: "You now have WAL. You can proceed with the registration." });
        // Volver a verificar el balance para actualizar el estado
        checkWalBalance();
    };

    const handleRegister = async () => {
    // Verificación proactiva: si no tiene WAL, abrir el modal de swap
    if (!hasWal) {
        setIsAcquireWalModalOpen(true);
        return;
    }
    if (!currentWallet || !currentAccount || isFormInvalid || !imageFile) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill all required fields and connect your wallet."
        });
        return;
    }

    setIsPending(true);
    try {
        console.log('🔄 [REGISTER] Iniciando proceso de registro...');
        console.log('📋 [REGISTER] Datos del formulario:', { name, bio, category, imageFile: imageFile.name, imageFileSize: imageFile.size });

        // --- VERIFICACIÓN DE WAL ANTES DEL REGISTRO ---
        console.log('🔍 [REGISTER] Verificando balance de WAL antes del registro...');
        await checkWalBalance(); // Forzar verificación
        
        if (!hasWal) {
            console.warn('⚠️ [REGISTER] Balance de WAL insuficiente detectado antes del registro');
            setIsAcquireWalModalOpen(true);
            return;
        }
        console.log('✅ [REGISTER] Balance de WAL verificado');

        // --- PREPARACIÓN DEL BLOB ---
        console.log('📂 [REGISTER] Preparando imagen para subir a Walrus...');
        toast({ title: "1/3: Uploading profile image to Walrus..." });
        
        const imageArrayBuffer = await imageFile.arrayBuffer();
        // CORRECCIÓN: Convertir ArrayBuffer a Uint8Array
        const uint8Array = new Uint8Array(imageArrayBuffer);
        console.log('📊 [REGISTER] Uint8Array de imagen creado:', { 
            length: uint8Array.length,
            byteLength: uint8Array.byteLength
        });

        // --- SUBIDA A WALRUS ---
        console.log('🚀 [REGISTER] Subiendo Uint8Array a Walrus...');
        console.log('🔧 [REGISTER] Configuración de walrusClient:', {
            hasWalrusClient: !!walrusClient,
        });

        const signer = {
            signAndExecuteTransaction: (tx: { transaction: Transaction }) =>
                signAndExecuteTransaction({ transaction: tx.transaction, account: currentAccount }),
        };

        console.log('📝 [REGISTER] Llamando a walrusClient.writeBlob...');
        console.log('📝 [REGISTER] Parámetros de writeBlob (CORREGIDO):', {
            deletable: false,
            epochs: 53,
            blobLength: uint8Array.length // Mostrar longitud en lugar del objeto
        });

        // --- CAPTURA ESPECÍFICA DEL ERROR ---
        let blobId;
        let finalImageUrl;
        try {
            // CORRECCIÓN: Pasar Uint8Array en lugar de Blob
            const { blobId: returnedBlobId } = await walrusClient.writeBlob({
                blob: uint8Array, // <- CORREGIDO: Usar Uint8Array
                signer: signer as any,
                deletable: false,
                epochs: 53,
            });
            blobId = returnedBlobId;
            finalImageUrl = `https://gateway.walrus.space/blobs/${blobId}`;
            console.log('✅ [REGISTER] Blob subido exitosamente:', { blobId, finalImageUrl });
        } catch (walrusError: any) {
            console.error('❌ [REGISTER] Error DETALLADO al subir a Walrus:', walrusError);
            console.error('❌ [REGISTER] Tipo de error:', typeof walrusError);
            console.error('❌ [REGISTER] Propiedades del error:', Object.keys(walrusError));
            
            // Intentar obtener más información del error
            if (walrusError.message) {
                console.error('❌ [REGISTER] Mensaje de error:', walrusError.message);
            }
            if (walrusError.code) {
                console.error('❌ [REGISTER] Código de error:', walrusError.code);
            }
            if (walrusError.response) {
                console.error('❌ [REGISTER] Respuesta de error:', walrusError.response);
            }
            if (walrusError.stack) {
                console.error('❌ [REGISTER] Stack trace:', walrusError.stack);
            }
            
            throw new Error(`Failed to upload image to Walrus: ${walrusError.message || walrusError}`);
        }

        toast({ title: "2/3: Registering profile on-chain..." });

        // --- REGISTRO EN CADENA ---
        console.log('🔗 [REGISTER] Creando transacción para registrar perfil en cadena...');
        console.log('🔗 [REGISTER] URL de imagen generada:', finalImageUrl);

        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::register_provider`,
            arguments: [
                tx.pure.string(name),
                tx.pure.string(bio),
                tx.pure.string(finalImageUrl),
                tx.pure.string(category),
            ],
        });

        console.log('📝 [REGISTER] Transacción SUI creada');
        console.log('📝 [REGISTER] Detalles de la llamada moveCall:', {
            target: `${suiConfig.packageId}::experience_nft::register_provider`,
            argumentCount: 4,
            nameLength: name.length,
            bioLength: bio.length,
            imageUrlLength: finalImageUrl.length,
            categoryLength: category.length
        });

        // --- EJECUCIÓN DE LA TRANSACCIÓN ---
        console.log('🚀 [REGISTER] Firmando y ejecutando transacción...');
        const result = await signAndExecuteTransaction({
            transaction: tx,
            account: currentAccount
        });
        
        console.log('✅ [REGISTER] Transacción ejecutada:', result);
        console.log('📋 [REGISTER] Digest de la transacción:', result.digest);

        // --- CONFIRMACIÓN ---
        console.log('⏳ [REGISTER] Esperando confirmación de la transacción...');
        toast({ title: "3/3: Confirming transaction..." });
        
        const txResult = await suiClient.waitForTransaction({
            digest: result.digest,
            options: { showEffects: true, showObjectChanges: true }
        });

        console.log('✅ [REGISTER] Transacción confirmada:', txResult);
        
        if (txResult.effects?.status.status === 'success') {
            console.log('🎉 [REGISTER] ¡Registro completado exitosamente!');
            toast({
                title: "✅ Success!",
                description: "Provider profile created successfully."
            });
            
            // Invalidar cachés relevantes
            queryClient.invalidateQueries({ queryKey: ['ownedObjects'] });
            
            // Redirigir al dashboard
            setTimeout(() => {
                router.push(`/${params.locale}/dashboard`);
            }, 1500);
        } else {
            console.error('❌ [REGISTER] La transacción falló:', txResult.effects);
            throw new Error("Transaction failed");
        }

    } catch (error: any) {
        console.error("❌ [REGISTER] Registration Failed:", error);
        console.error("❌ [REGISTER] Tipo de error:", typeof error);
        console.error("❌ [REGISTER] Mensaje de error:", error.message);
        console.error("❌ [REGISTER] Stack trace:", error.stack);
        
        // Loggear propiedades específicas del error si existen
        if (error.cause) {
            console.error("❌ [REGISTER] Causa del error:", error.cause);
        }
        if (error.code) {
            console.error("❌ [REGISTER] Código de error:", error.code);
        }
        
        toast({
            variant: "destructive",
            title: "❌ Registration Failed",
            description: error.message || "An unexpected error occurred during registration."
        });
    } finally {
        setIsPending(false);
        console.log('🏁 [REGISTER] Proceso de registro finalizado');
    }
};
    
    if (isLoadingProfile) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10" /></div>;
    }
    
    if (isAlreadyProvider) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-4">
                <AnimatedBackground />
                <Card className="max-w-md mx-auto glass-card p-8 relative z-10">
                    <CardHeader>
                        <BadgeCheck className="w-16 h-16 mx-auto text-green-500" />
                        <CardTitle className="text-2xl mt-4 text-foreground">
                            You're Already a Provider!
                        </CardTitle>
                        <CardDescription className="mt-2 text-muted-foreground">
                            You can now manage your experiences and view your sales from your dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-4 mt-4'>
                        <Button asChild size="lg" className="w-full btn-sui">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Link>
                    </Button>
                </div>
                
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Become a Provider</h1>
                        <p className="text-muted-foreground mt-2">Create your profile to start selling unique experiences on TokenTrip.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Columna del Formulario */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-2xl text-foreground">Your Profile Details</CardTitle>
                                <CardDescription>This information will be public and visible to all buyers.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2"><Label>Store or Brand Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>Provider Category</Label>
                                    <Select onValueChange={setCategory} value={category}>
                                        <SelectTrigger disabled={isPending}><SelectValue placeholder="Select your primary category..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Events">🎟️ Event Organizers & Venues</SelectItem>
                                            <SelectItem value="Hospitality">🏨 Hospitality & Lodging</SelectItem>
                                            <SelectItem value="Tours">🗺️ Tour & Activity Operators</SelectItem>
                                            <SelectItem value="Digital">🖥️ Digital Content & Media</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Short Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} disabled={isPending} /></div>
                                <div className="space-y-2"><Label>Logo or Profile Image</Label><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} disabled={isPending} className="pt-2"/></div>
                                
                                <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleRegister} disabled={isPending || isCheckingWal || !currentAccount || isFormInvalid}>
                                    {isCheckingWal ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Store className="w-5 h-5 mr-2" />}
                                    {isCheckingWal ? "Checking Wallet..." : (isPending ? "Registering..." : "Create Provider Profile")}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Columna de Previsualización */}
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">Live Preview</h3>
                            <ProviderInfoCard name={name || "..."} bio={bio || "..."} imageUrl={imagePreview || "..."} averageRating={0} totalReviews={0} isLoading={false} isVerified={false} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL PARA ADQUIRIR WAL CON MINISWAP --- */}
            <Dialog open={isAcquireWalModalOpen} onOpenChange={setIsAcquireWalModalOpen}>
                <DialogContent className="glass-card">
                    <DialogHeader>
                        <DialogTitle>Storage Token (WAL) Required</DialogTitle>
                        <DialogDescription className="pt-2">
                            To store your image on-chain, Walrus requires a small payment in WAL tokens. You can swap a little SUI to get the required WAL right here.
                        </DialogDescription>
                    </DialogHeader>
                    <MiniSwap 
                        fromCoinType='0x2::sui::SUI'
                        toCoinType={WAL_COIN_TYPE}
                        onSwapSuccess={handleSwapSuccess}
                    />
                </DialogContent>
            </Dialog>
            <Toaster />
        </div>
    );
}